import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { mutateFlow, type MutableFlow } from "@liveblocks/react-flow/node"
import { generateText, Output } from "ai"

import { getLiveblocksClient } from "@/lib/liveblocks"
import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SHAPE,
  NODE_COLORS,
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas"
import {
  AI_STATUS_FEED_ID,
  type AiStatusFeedPayload,
  type AiStatusPhase,
} from "@/types/tasks"

export const AI_AGENT_USER_ID = "ghost-ai"
export { AI_STATUS_FEED_ID }
export const AI_AGENT_COLOR = "#A1A1AA"
export const AI_AGENT_NAME = "Ghost AI"

export type { AiStatusPhase }
export type AiStatusMessageData = AiStatusFeedPayload

export type DesignCanvasAction =
  | {
    type: "addNode"
    id: string
    label: string
    shape: NodeShape
    color: string
    x: number
    y: number
    width?: number
    height?: number
  }
  | { type: "moveNode"; id: string; x: number; y: number }
  | { type: "resizeNode"; id: string; width: number; height: number }
  | {
    type: "updateNodeData"
    id: string
    label?: string
    color?: string
    shape?: NodeShape
  }
  | { type: "deleteNode"; id: string }
  | {
    type: "addEdge"
    id: string
    source: string
    target: string
    label?: string
  }
  | { type: "deleteEdge"; id: string }

interface DesignPlan {
  actions: DesignCanvasAction[]
  summary: string
}

const ALLOWED_FILLS = new Set<string>(NODE_COLORS.map((pair) => pair.fill))
const ALLOWED_SHAPES = new Set<string>(NODE_SHAPES)

const PRESENCE_TTL_SECONDS = 120
const PRESENCE_CLEAR_TTL_SECONDS = 2

export async function setAiPresence(
  roomId: string,
  data: {
    cursor: { x: number; y: number } | null
    thinking: boolean
  },
  ttl = PRESENCE_TTL_SECONDS,
): Promise<void> {
  const liveblocks = getLiveblocksClient()
  await liveblocks.setPresence(roomId, {
    userId: AI_AGENT_USER_ID,
    userInfo: {
      name: AI_AGENT_NAME,
      avatar: "",
      color: AI_AGENT_COLOR,
    },
    data,
    ttl,
  })
}

export async function clearAiPresence(roomId: string): Promise<void> {
  await setAiPresence(
    roomId,
    { cursor: null, thinking: false },
    PRESENCE_CLEAR_TTL_SECONDS,
  )
}

export async function ensureAiStatusFeed(roomId: string): Promise<void> {
  const liveblocks = getLiveblocksClient()

  try {
    await liveblocks.getFeed({ roomId, feedId: AI_STATUS_FEED_ID })
    return
  } catch (error) {
    if (!isLiveblocksStatus(error, 404)) {
      throw enrichLiveblocksError("getFeed", error)
    }
  }

  try {
    await liveblocks.createFeed({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      metadata: { kind: "ai-status" },
    })
  } catch (error) {
    // Another run may have created the feed first (common on Trigger retries).
    if (!isLiveblocksStatus(error, 409)) {
      throw enrichLiveblocksError("createFeed", error)
    }
  }
}

export async function publishAiStatus(
  roomId: string,
  messageId: string,
  data: AiStatusMessageData,
): Promise<void> {
  const liveblocks = getLiveblocksClient()
  const safeMessageId = sanitizeFeedMessageId(messageId)
  await ensureAiStatusFeed(roomId)
  const payload: AiStatusMessageData = {
    ...data,
    text: data.text ?? data.label,
  }

  // Upsert by stable run id. Liveblocks often returns 500 (not 409) when
  // createFeedMessage is called with an id that already exists — common on
  // Trigger retries and on start→processing→complete updates of the same row.
  try {
    await liveblocks.createFeedMessage({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      id: safeMessageId,
      data: payload,
    })
    return
  } catch (createError) {
    if (isLiveblocksStatus(createError, 404)) {
      await ensureAiStatusFeed(roomId)
      try {
        await liveblocks.createFeedMessage({
          roomId,
          feedId: AI_STATUS_FEED_ID,
          id: safeMessageId,
          data: payload,
        })
        return
      } catch (retryCreateError) {
        await updateAiStatusOrThrow(
          roomId,
          safeMessageId,
          payload,
          retryCreateError,
        )
        return
      }
    }

    await updateAiStatusOrThrow(roomId, safeMessageId, payload, createError)
  }
}

async function updateAiStatusOrThrow(
  roomId: string,
  messageId: string,
  data: AiStatusMessageData,
  createError: unknown,
): Promise<void> {
  const liveblocks = getLiveblocksClient()

  try {
    await liveblocks.updateFeedMessage({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      messageId,
      data,
      updatedAt: Date.now(),
    })
  } catch (updateError) {
    // Update 404 means the create failure was not an id conflict — surface
    // the original create error (e.g. a genuine Liveblocks 500).
    if (isLiveblocksStatus(updateError, 404)) {
      throw enrichLiveblocksError("createFeedMessage", createError)
    }
    throw enrichLiveblocksError("updateFeedMessage", updateError)
  }
}

export async function planDesignActions(input: {
  prompt: string
  nodes: readonly CanvasNode[]
  edges: readonly CanvasEdge[]
}): Promise<DesignPlan> {
  const apiKey = process.env.GEMINI_AI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_AI_API_KEY is not set")
  }

  const google = createGoogleGenerativeAI({ apiKey })
  const canvasSnapshot = {
    nodes: input.nodes.map((node) => ({
      id: node.id,
      label: node.data.label,
      shape: node.data.shape,
      color: node.data.color,
      x: node.position.x,
      y: node.position.y,
      width: node.width ?? SHAPE_DEFAULT_SIZES[node.data.shape].width,
      height: node.height ?? SHAPE_DEFAULT_SIZES[node.data.shape].height,
    })),
    edges: input.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.data?.label ?? "",
    })),
  }

  const { output } = await generateText({
    model: google("gemini-3.6-flash"),
    output: Output.json(),
    system: [
      "You are Ghost AI, an architecture design agent for a collaborative canvas.",
      "Return JSON only with shape: { summary: string, actions: Action[] }.",
      "Supported actions:",
      '- { "type":"addNode","id":string,"label":string,"shape":Shape,"color":Fill,"x":number,"y":number,"width"?:number,"height"?:number }',
      '- { "type":"moveNode","id":string,"x":number,"y":number }',
      '- { "type":"resizeNode","id":string,"width":number,"height":number }',
      '- { "type":"updateNodeData","id":string,"label"?:string,"color"?:Fill,"shape"?:Shape }',
      '- { "type":"deleteNode","id":string }',
      '- { "type":"addEdge","id":string,"source":string,"target":string,"label"?:string }',
      '- { "type":"deleteEdge","id":string }',
      `Allowed shapes: ${NODE_SHAPES.join(", ")}.`,
      "Shape guidance: rectangle=general, diamond=decision, circle=event/endpoint, pill=service/process, cylinder=database/storage, hexagon=external system.",
      `Allowed node fill colors: ${NODE_COLORS.map((c) => c.fill).join(", ")}.`,
      "Layout rules: left-to-right data flow, keep 180–260px horizontal spacing and 100–160px vertical spacing between nodes, avoid overlaps, prefer neat rows/columns.",
      "Prefer extending the existing canvas when nodes already exist. Only rebuild when the user asks for a fresh design.",
      "Generate stable unique ids for new nodes/edges (prefix with ai-). Reference existing ids for move/resize/update/delete.",
      "Keep labels short (1–4 words). Produce only the actions needed to satisfy the prompt.",
    ].join("\n"),
    prompt: [
      `User prompt:\n${input.prompt}`,
      `Current canvas JSON:\n${JSON.stringify(canvasSnapshot)}`,
    ].join("\n\n"),
  })

  return parseDesignPlan(output)
}

export function applyDesignActions(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  actions: DesignCanvasAction[],
): void {
  for (const action of actions) {
    switch (action.type) {
      case "addNode": {
        const shape = sanitizeShape(action.shape)
        const defaults = SHAPE_DEFAULT_SIZES[shape]
        const width = sanitizeSize(action.width, defaults.width)
        const height = sanitizeSize(action.height, defaults.height)
        flow.addNode({
          id: action.id,
          type: "canvasNode",
          position: { x: action.x, y: action.y },
          width,
          height,
          data: {
            label: action.label.trim() || "Node",
            color: sanitizeColor(action.color),
            shape,
          },
        })
        break
      }
      case "moveNode": {
        flow.updateNode(action.id, {
          position: { x: action.x, y: action.y },
        })
        break
      }
      case "resizeNode": {
        flow.updateNode(action.id, {
          width: Math.max(48, action.width),
          height: Math.max(48, action.height),
        })
        break
      }
      case "updateNodeData": {
        const patch: Partial<CanvasNode["data"]> = {}
        if (typeof action.label === "string") {
          patch.label = action.label.trim()
        }
        if (typeof action.color === "string") {
          patch.color = sanitizeColor(action.color)
        }
        if (typeof action.shape === "string") {
          patch.shape = sanitizeShape(action.shape)
        }
        if (Object.keys(patch).length > 0) {
          flow.updateNodeData(action.id, patch)
        }
        break
      }
      case "deleteNode": {
        const connected = flow.edges
          .filter(
            (edge) =>
              edge.source === action.id || edge.target === action.id,
          )
          .map((edge) => edge.id)
        if (connected.length > 0) {
          flow.removeEdges(connected)
        }
        flow.removeNode(action.id)
        break
      }
      case "addEdge": {
        flow.addEdge({
          id: action.id,
          type: "canvasEdge",
          source: action.source,
          target: action.target,
          data: { label: action.label?.trim() ?? "" },
          style: {
            stroke: DEFAULT_EDGE_COLOR,
            strokeWidth: 1.25,
          },
        })
        break
      }
      case "deleteEdge": {
        flow.removeEdge(action.id)
        break
      }
      default: {
        const _exhaustive: never = action
        void _exhaustive
      }
    }
  }
}

export async function mutateCanvasWithAi(
  roomId: string,
  callback: (
    flow: MutableFlow<CanvasNode, CanvasEdge>,
  ) => void | Promise<void>,
): Promise<void> {
  const client = getLiveblocksClient()
  await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, callback)
}

export function cursorForActions(
  actions: DesignCanvasAction[],
  nodes: readonly CanvasNode[],
): { x: number; y: number } {
  for (let i = actions.length - 1; i >= 0; i--) {
    const action = actions[i]!
    if (action.type === "addNode" || action.type === "moveNode") {
      return { x: action.x + 40, y: action.y + 20 }
    }
    if (
      action.type === "resizeNode" ||
      action.type === "updateNodeData" ||
      action.type === "deleteNode"
    ) {
      const node = nodes.find((n) => n.id === action.id)
      if (node) {
        return {
          x: node.position.x + 40,
          y: node.position.y + 20,
        }
      }
    }
  }

  if (nodes.length > 0) {
    const xs = nodes.map((n) => n.position.x)
    const ys = nodes.map((n) => n.position.y)
    return {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    }
  }

  return { x: 240, y: 180 }
}

function parseDesignPlan(output: unknown): DesignPlan {
  if (!isRecord(output)) {
    throw new Error("Gemini returned an invalid design plan")
  }

  const summary =
    typeof output.summary === "string" && output.summary.trim()
      ? output.summary.trim()
      : "Updated the canvas design."

  const rawActions = Array.isArray(output.actions) ? output.actions : []
  const actions: DesignCanvasAction[] = []

  for (const raw of rawActions) {
    const action = parseAction(raw)
    if (action) {
      actions.push(action)
    }
  }

  if (actions.length === 0) {
    throw new Error("Gemini returned no valid canvas actions")
  }

  return { summary, actions }
}

function parseAction(raw: unknown): DesignCanvasAction | null {
  if (!isRecord(raw) || typeof raw.type !== "string") {
    return null
  }

  switch (raw.type) {
    case "addNode": {
      if (
        typeof raw.id !== "string" ||
        typeof raw.label !== "string" ||
        typeof raw.x !== "number" ||
        typeof raw.y !== "number"
      ) {
        return null
      }
      return {
        type: "addNode",
        id: raw.id,
        label: raw.label,
        shape: sanitizeShape(raw.shape),
        color: sanitizeColor(typeof raw.color === "string" ? raw.color : ""),
        x: raw.x,
        y: raw.y,
        width: typeof raw.width === "number" ? raw.width : undefined,
        height: typeof raw.height === "number" ? raw.height : undefined,
      }
    }
    case "moveNode": {
      if (
        typeof raw.id !== "string" ||
        typeof raw.x !== "number" ||
        typeof raw.y !== "number"
      ) {
        return null
      }
      return { type: "moveNode", id: raw.id, x: raw.x, y: raw.y }
    }
    case "resizeNode": {
      if (
        typeof raw.id !== "string" ||
        typeof raw.width !== "number" ||
        typeof raw.height !== "number"
      ) {
        return null
      }
      return {
        type: "resizeNode",
        id: raw.id,
        width: raw.width,
        height: raw.height,
      }
    }
    case "updateNodeData": {
      if (typeof raw.id !== "string") {
        return null
      }
      return {
        type: "updateNodeData",
        id: raw.id,
        label: typeof raw.label === "string" ? raw.label : undefined,
        color: typeof raw.color === "string" ? sanitizeColor(raw.color) : undefined,
        shape:
          typeof raw.shape === "string" ? sanitizeShape(raw.shape) : undefined,
      }
    }
    case "deleteNode": {
      if (typeof raw.id !== "string") {
        return null
      }
      return { type: "deleteNode", id: raw.id }
    }
    case "addEdge": {
      if (
        typeof raw.id !== "string" ||
        typeof raw.source !== "string" ||
        typeof raw.target !== "string"
      ) {
        return null
      }
      return {
        type: "addEdge",
        id: raw.id,
        source: raw.source,
        target: raw.target,
        label: typeof raw.label === "string" ? raw.label : undefined,
      }
    }
    case "deleteEdge": {
      if (typeof raw.id !== "string") {
        return null
      }
      return { type: "deleteEdge", id: raw.id }
    }
    default:
      return null
  }
}

function sanitizeShape(value: unknown): NodeShape {
  if (typeof value === "string" && ALLOWED_SHAPES.has(value)) {
    return value as NodeShape
  }
  return DEFAULT_NODE_SHAPE
}

function sanitizeColor(value: string): string {
  if (ALLOWED_FILLS.has(value)) {
    return value
  }
  return DEFAULT_NODE_COLOR.fill
}

function sanitizeSize(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }
  return Math.max(48, Math.round(value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Duck-type Liveblocks HTTP errors. Prefer this over `instanceof LiveblocksError`
 * because Trigger.dev's worker bundle can load a different copy of the class.
 */
function getLiveblocksStatus(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined
  }
  return typeof error.status === "number" ? error.status : undefined
}

function isLiveblocksStatus(error: unknown, status: number): boolean {
  return getLiveblocksStatus(error) === status
}

function enrichLiveblocksError(operation: string, error: unknown): Error {
  const status = getLiveblocksStatus(error)
  const details =
    isRecord(error) && typeof error.details === "string"
      ? error.details
      : undefined
  const baseMessage =
    error instanceof Error && error.message
      ? error.message
      : "Unknown Liveblocks error"

  const statusPart = status !== undefined ? ` (status ${status})` : ""
  const message = details
    ? `Liveblocks ${operation} failed${statusPart}: ${baseMessage}\n${details}`
    : `Liveblocks ${operation} failed${statusPart}: ${baseMessage}`

  return new Error(message, { cause: error })
}

/** Keep feed message ids URL-safe and stable across Trigger retries. */
function sanitizeFeedMessageId(messageId: string): string {
  const cleaned = messageId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return cleaned || `ai-status-${Date.now()}`
}
