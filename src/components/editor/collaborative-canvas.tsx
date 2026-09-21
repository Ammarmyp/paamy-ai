"use client"

import { useCallback, type DragEvent, type MouseEvent } from "react"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
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
import { LiveCursors } from "@/components/editor/live-cursors"
import { PresenceAvatars } from "@/components/editor/presence-avatars"
import { ShapePanel } from "@/components/editor/shape-panel"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { useStarterTemplatesUi } from "@/components/editor/starter-templates-ui"
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

export function CollaborativeCanvas() {
  return (
    <ReactFlowProvider>
      <CollaborativeCanvasInner />
    </ReactFlowProvider>
  )
}

function CollaborativeCanvasInner() {
  const { screenToFlowPosition, fitView } = useReactFlow()
  const { isOpen, setOpen } = useStarterTemplatesUi()
  const updateMyPresence = useUpdateMyPresence()

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

  const replaceCanvasWithTemplate = useMutation(
    ({ storage }, template: CanvasTemplate) => {
      // React Flow storage key is managed by useLiveblocksFlow; Storage typing is empty.
      const flow = (
        storage as unknown as { get: (key: string) => FlowLiveObject | undefined }
      ).get(FLOW_STORAGE_KEY)
      if (!flow) {
        return
      }

      const nodesMap = flow.get("nodes")
      const edgesMap = flow.get("edges")

      for (const edgeId of [...edgesMap.keys()]) {
        edgesMap.delete(edgeId)
      }
      for (const nodeId of [...nodesMap.keys()]) {
        nodesMap.delete(nodeId)
      }

      for (const node of template.nodes) {
        nodesMap.set(node.id, toLiveNode(node))
      }

      for (const edge of template.edges) {
        edgesMap.set(edge.id, toLiveEdge(edge))
      }
    },
    [],
  )

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

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

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
      replaceCanvasWithTemplate(template)

      window.setTimeout(() => {
        void fitView({ duration: FIT_VIEW_DURATION_MS, padding: 0.2 })
      }, 50)
    },
    [fitView, replaceCanvasWithTemplate],
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
        fitView
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
