"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdges,
  useNodes,
  useReactFlow,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react"
import { LiveObject } from "@liveblocks/client"
import { useMutation, useUpdateMyPresence } from "@liveblocks/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"

import { CanvasControls } from "@/components/editor/canvas-controls"
import { CanvasEdgeComponent } from "@/components/editor/canvas-edge"
import { CanvasNodeComponent } from "@/components/editor/canvas-node"
import { useCanvasSaveUi } from "@/components/editor/canvas-save-ui"
import { LiveCursors } from "@/components/editor/live-cursors"
import { PresenceAvatars } from "@/components/editor/presence-avatars"
import { ShapePanel } from "@/components/editor/shape-panel"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { useStarterTemplatesUi } from "@/components/editor/starter-templates-ui"
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave"
import {
  parseCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/canvas-storage"
import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  SHAPE_DRAG_MIME,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
  type ShapeDragPayload,
} from "@/types/canvas"

import "@xyflow/react/dist/style.css"

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeComponent,
}

const edgeTypes: EdgeTypes = {
  canvasEdge: CanvasEdgeComponent,
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "canvasEdge",
  data: {
    label: "",
  },
  style: {
    stroke: DEFAULT_EDGE_COLOR,
    strokeWidth: 1.25,
    strokeLinecap: "round",
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 14,
    height: 14,
    color: DEFAULT_EDGE_COLOR,
  },
}

const FIT_VIEW_DURATION_MS = 200
const FLOW_STORAGE_KEY = "flow"

/** Matches @liveblocks/react-flow node sync defaults so local-only fields stay local. */
const NODE_LIVE_CONFIG = {
  selected: false,
  dragging: false,
  measured: false,
  resizing: false,
  position: "atomic",
  sourcePosition: "atomic",
  targetPosition: "atomic",
  extent: "atomic",
  origin: "atomic",
  handles: "atomic",
} as const

/** Matches @liveblocks/react-flow edge sync defaults. */
const EDGE_LIVE_CONFIG = {
  selected: false,
  markerStart: "atomic",
  markerEnd: "atomic",
  label: "atomic",
  labelBgPadding: "atomic",
} as const

interface FlowLiveMap {
  keys: () => IterableIterator<string>
  delete: (id: string) => boolean
  set: (id: string, value: ReturnType<typeof LiveObject.from>) => void
}

interface FlowLiveObject {
  get: (key: "nodes" | "edges") => FlowLiveMap
}

function toLiveNode(node: CanvasNode) {
  return LiveObject.from(
    {
      id: node.id,
      type: node.type ?? "canvasNode",
      position: { x: node.position.x, y: node.position.y },
      width: node.width ?? null,
      height: node.height ?? null,
      data: {
        label: node.data.label,
        color: node.data.color,
        shape: node.data.shape,
      },
    },
    NODE_LIVE_CONFIG,
  )
}

function toLiveEdge(edge: CanvasEdge) {
  return LiveObject.from(
    {
      id: edge.id,
      type: edge.type ?? "canvasEdge",
      source: edge.source,
      target: edge.target,
      ...(edge.sourceHandle != null
        ? { sourceHandle: edge.sourceHandle }
        : {}),
      ...(edge.targetHandle != null
        ? { targetHandle: edge.targetHandle }
        : {}),
      data: {
        label: edge.data?.label ?? "",
      },
      ...(edge.style
        ? {
            style: {
              stroke: edge.style.stroke ?? DEFAULT_EDGE_COLOR,
              strokeWidth: edge.style.strokeWidth ?? 1.25,
            },
          }
        : {}),
    },
    EDGE_LIVE_CONFIG,
  )
}

let nodeIdCounter = 0

function createNodeId(shape: NodeShape) {
  nodeIdCounter += 1
  return `${shape}-${Date.now()}-${nodeIdCounter}`
}

function parseShapeDragPayload(raw: string): ShapeDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as ShapeDragPayload
    if (!NODE_SHAPES.includes(parsed.shape)) {
      return null
    }
    if (
      typeof parsed.width !== "number" ||
      typeof parsed.height !== "number"
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function parseLoadedCanvas(payload: unknown): CanvasSnapshot | null {
  if (!isRecord(payload)) {
    return null
  }

  try {
    if (isRecord(payload.canvas)) {
      return parseCanvasSnapshot(payload.canvas)
    }
    return parseCanvasSnapshot(payload)
  } catch {
    return null
  }
}

function isEditableKeyTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const tagName = target.tagName
  return tagName === "INPUT" || tagName === "TEXTAREA"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

interface CollaborativeCanvasProps {
  projectId: string
}

export function CollaborativeCanvas({ projectId }: CollaborativeCanvasProps) {
  return (
    <ReactFlowProvider>
      <CollaborativeCanvasInner projectId={projectId} />
    </ReactFlowProvider>
  )
}

function CollaborativeCanvasInner({ projectId }: CollaborativeCanvasProps) {
  const { screenToFlowPosition, fitView } = useReactFlow()
  const flowNodes = useNodes<CanvasNode>()
  const flowEdges = useEdges<CanvasEdge>()
  const { isOpen, setOpen } = useStarterTemplatesUi()
  const { setStatus, registerSaveNow } = useCanvasSaveUi()
  const updateMyPresence = useUpdateMyPresence()
  const [isHydrated, setIsHydrated] = useState(false)
  const hasAttemptedLoadRef = useRef(false)

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: {
        initial: [],
      },
      edges: {
        initial: [],
      },
    })

  const replaceCanvasContents = useMutation(
    (
      { storage },
      snapshot: Pick<CanvasTemplate, "nodes" | "edges">,
      options?: { onlyIfEmpty?: boolean },
    ) => {
      // React Flow storage key is managed by useLiveblocksFlow; Storage typing is empty.
      const flow = (
        storage as unknown as { get: (key: string) => FlowLiveObject | undefined }
      ).get(FLOW_STORAGE_KEY)
      if (!flow) {
        return false
      }

      const nodesMap = flow.get("nodes")
      const edgesMap = flow.get("edges")

      if (options?.onlyIfEmpty) {
        const hasNodes = [...nodesMap.keys()].length > 0
        const hasEdges = [...edgesMap.keys()].length > 0
        if (hasNodes || hasEdges) {
          return false
        }
      }

      for (const edgeId of [...edgesMap.keys()]) {
        edgesMap.delete(edgeId)
      }
      for (const nodeId of [...nodesMap.keys()]) {
        nodesMap.delete(nodeId)
      }

      for (const node of snapshot.nodes) {
        nodesMap.set(node.id, toLiveNode(node))
      }

      for (const edge of snapshot.edges) {
        edgesMap.set(edge.id, toLiveEdge(edge))
      }

      return true
    },
    [],
  )

  const { status, saveNow } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: isHydrated,
  })

  useEffect(() => {
    if (!isHydrated) {
      return
    }
    setStatus(status)
  }, [isHydrated, setStatus, status])

  useEffect(() => {
    registerSaveNow(saveNow)
    return () => {
      registerSaveNow(null)
    }
  }, [registerSaveNow, saveNow])

  useEffect(() => {
    if (hasAttemptedLoadRef.current) {
      return
    }
    hasAttemptedLoadRef.current = true

    let cancelled = false

    async function loadSavedCanvasIfNeeded() {
      if (nodes.length > 0 || edges.length > 0) {
        if (!cancelled) {
          setIsHydrated(true)
        }
        return
      }

      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`)
        if (cancelled) {
          return
        }

        // No saved canvas is a successful empty restore — enable autosave.
        if (response.status === 404) {
          setIsHydrated(true)
          return
        }

        if (!response.ok) {
          setStatus("error")
          return
        }

        const payload: unknown = await response.json()
        const canvas = parseLoadedCanvas(payload)
        if (!canvas) {
          setStatus("error")
          return
        }

        if (canvas.nodes.length === 0 && canvas.edges.length === 0) {
          setIsHydrated(true)
          return
        }

        const applied = replaceCanvasContents(canvas, { onlyIfEmpty: true })
        if (applied) {
          window.setTimeout(() => {
            void fitView({ duration: FIT_VIEW_DURATION_MS, padding: 0.2 })
          }, 50)
        }

        setIsHydrated(true)
      } catch {
        if (!cancelled) {
          setStatus("error")
        }
      }
    }

    void loadSavedCanvasIfNeeded()

    return () => {
      cancelled = true
    }
    // Run once after Liveblocks storage is ready (suspense resolved).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only hydrate
  }, [])

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const raw = event.dataTransfer.getData(SHAPE_DRAG_MIME)
      const payload = parseShapeDragPayload(raw)
      if (!payload) {
        return
      }

      const cursorPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      // Place the node's center on the cursor (position is top-left in React Flow).
      const position = {
        x: cursorPosition.x - payload.width / 2,
        y: cursorPosition.y - payload.height / 2,
      }

      const newNode: CanvasNode = {
        id: createNodeId(payload.shape),
        type: "canvasNode",
        position,
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR.fill,
          shape: payload.shape,
        },
      }

      onNodesChange([
        {
          type: "add",
          item: newNode,
        },
      ])
    },
    [onNodesChange, screenToFlowPosition],
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      updateMyPresence({ cursor: position })
    },
    [screenToFlowPosition, updateMyPresence],
  )

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      replaceCanvasContents(template)

      window.setTimeout(() => {
        void fitView({ duration: FIT_VIEW_DURATION_MS, padding: 0.2 })
      }, 50)
    },
    [fitView, replaceCanvasContents],
  )

  const handleCanvasKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return
      }

      if (isEditableKeyTarget(event.target)) {
        return
      }

      const selectedNodes = flowNodes.filter((node) => node.selected)
      const selectedEdges = flowEdges.filter((edge) => edge.selected)

      if (selectedNodes.length === 0 && selectedEdges.length === 0) {
        return
      }

      event.preventDefault()
      onDelete({
        nodes: selectedNodes,
        edges: selectedEdges,
      })
    },
    [flowEdges, flowNodes, onDelete],
  )

  const canvasEdges = edges.map((edge) =>
    edge.type === "canvasEdge"
      ? edge
      : {
          ...edge,
          type: "canvasEdge" as const,
          data: {
            label: "",
            ...edge.data,
          },
        },
  )

  return (
    <div
      className="relative h-full min-h-0 w-full flex-1"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleCanvasKeyDown}
    >
      <ReactFlow
        nodes={nodes}
        edges={canvasEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={null}
        className="bg-base"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="var(--border-default)"
        />
      </ReactFlow>
      <LiveCursors />
      <PresenceAvatars />
      <CanvasControls />
      <ShapePanel />
      <StarterTemplatesModal
        open={isOpen}
        onOpenChange={setOpen}
        onImport={handleImportTemplate}
      />
    </div>
  )
}
