"use client"

import { useCallback, type DragEvent } from "react"
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
import { useLiveblocksFlow } from "@liveblocks/react-flow"

import { CanvasControls } from "@/components/editor/canvas-controls"
import { CanvasEdgeComponent } from "@/components/editor/canvas-edge"
import { CanvasNodeComponent } from "@/components/editor/canvas-node"
import { ShapePanel } from "@/components/editor/shape-panel"
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
  const { screenToFlowPosition } = useReactFlow()

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
      <CanvasControls />
      <ShapePanel />
    </div>
  )
}
