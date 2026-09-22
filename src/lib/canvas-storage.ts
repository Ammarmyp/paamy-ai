import { get, put } from "@vercel/blob"

import {
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas"

export interface CanvasSnapshot {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export function canvasBlobPathname(projectId: string): string {
  return `canvas/${projectId}.json`
}

export async function uploadCanvasSnapshot(
  projectId: string,
  snapshot: CanvasSnapshot,
): Promise<string> {
  const blob = await put(
    canvasBlobPathname(projectId),
    JSON.stringify(snapshot),
    {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    },
  )

  return blob.url
}

export async function fetchCanvasSnapshotFromUrl(
  url: string,
): Promise<CanvasSnapshot> {
  const result = await get(url, {
    access: "private",
    useCache: false,
  })

  if (!result || result.statusCode !== 200 || !result.stream) {
    const status = result?.statusCode ?? "null"
    throw new Error(`Failed to fetch canvas blob (${status})`)
  }

  const payload: unknown = await new Response(result.stream).json()
  return parseCanvasSnapshot(payload)
}

export function parseCanvasSnapshot(value: unknown): CanvasSnapshot {
  if (!isRecord(value)) {
    throw new Error("Invalid canvas snapshot")
  }

  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    throw new Error("Canvas snapshot must include nodes and edges arrays")
  }

  return {
    nodes: value.nodes.map((node, index) => parseCanvasNode(node, index)),
    edges: value.edges.map((edge, index) => parseCanvasEdge(edge, index)),
  }
}

export function serializeCanvasForSave(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): CanvasSnapshot {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type ?? "canvasNode",
      position: node.position,
      width: node.width,
      height: node.height,
      data: {
        label: node.data.label,
        color: node.data.color,
        shape: node.data.shape,
      },
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      type: edge.type ?? "canvasEdge",
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
      data: {
        label: edge.data?.label ?? "",
      },
    })),
  }
}

function parseCanvasNode(value: unknown, index: number): CanvasNode {
  if (!isRecord(value)) {
    throw new Error(`Invalid canvas node at index ${index}`)
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error(`Canvas node at index ${index} requires a non-empty id`)
  }

  if (value.type !== undefined && value.type !== "canvasNode") {
    throw new Error(`Canvas node ${value.id} has an unsupported type`)
  }

  if (!isRecord(value.position)) {
    throw new Error(`Canvas node ${value.id} requires a position`)
  }

  if (
    typeof value.position.x !== "number" ||
    !Number.isFinite(value.position.x) ||
    typeof value.position.y !== "number" ||
    !Number.isFinite(value.position.y)
  ) {
    throw new Error(`Canvas node ${value.id} has an invalid position`)
  }

  const width = parseOptionalDimension(value.width, value.id, "width")
  const height = parseOptionalDimension(value.height, value.id, "height")

  if (!isRecord(value.data)) {
    throw new Error(`Canvas node ${value.id} requires data`)
  }

  if (typeof value.data.label !== "string") {
    throw new Error(`Canvas node ${value.id} requires a string label`)
  }

  if (typeof value.data.color !== "string" || value.data.color.length === 0) {
    throw new Error(`Canvas node ${value.id} requires a color`)
  }

  if (!isNodeShape(value.data.shape)) {
    throw new Error(`Canvas node ${value.id} has an invalid shape`)
  }

  return {
    id: value.id,
    type: "canvasNode",
    position: {
      x: value.position.x,
      y: value.position.y,
    },
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    data: {
      label: value.data.label,
      color: value.data.color,
      shape: value.data.shape,
    },
  }
}

function parseCanvasEdge(value: unknown, index: number): CanvasEdge {
  if (!isRecord(value)) {
    throw new Error(`Invalid canvas edge at index ${index}`)
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error(`Canvas edge at index ${index} requires a non-empty id`)
  }

  if (value.type !== undefined && value.type !== "canvasEdge") {
    throw new Error(`Canvas edge ${value.id} has an unsupported type`)
  }

  if (typeof value.source !== "string" || value.source.length === 0) {
    throw new Error(`Canvas edge ${value.id} requires a source`)
  }

  if (typeof value.target !== "string" || value.target.length === 0) {
    throw new Error(`Canvas edge ${value.id} requires a target`)
  }

  const sourceHandle = parseOptionalHandle(
    value.sourceHandle,
    value.id,
    "sourceHandle",
  )
  const targetHandle = parseOptionalHandle(
    value.targetHandle,
    value.id,
    "targetHandle",
  )

  let label = ""
  if (value.data !== undefined) {
    if (!isRecord(value.data)) {
      throw new Error(`Canvas edge ${value.id} has invalid data`)
    }
    if (value.data.label !== undefined && typeof value.data.label !== "string") {
      throw new Error(`Canvas edge ${value.id} has an invalid label`)
    }
    label = value.data.label ?? ""
  }

  return {
    id: value.id,
    type: "canvasEdge",
    source: value.source,
    target: value.target,
    ...(sourceHandle !== undefined ? { sourceHandle } : {}),
    ...(targetHandle !== undefined ? { targetHandle } : {}),
    data: {
      label,
    },
  }
}

function parseOptionalDimension(
  value: unknown,
  nodeId: string,
  field: "width" | "height",
): number | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Canvas node ${nodeId} has an invalid ${field}`)
  }

  return value
}

function parseOptionalHandle(
  value: unknown,
  edgeId: string,
  field: "sourceHandle" | "targetHandle",
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value !== "string") {
    throw new Error(`Canvas edge ${edgeId} has an invalid ${field}`)
  }

  return value
}

function isNodeShape(value: unknown): value is NodeShape {
  return (
    typeof value === "string" &&
    (NODE_SHAPES as readonly string[]).includes(value)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
