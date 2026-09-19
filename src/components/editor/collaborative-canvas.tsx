"use client"

import { useCallback, type DragEvent } from "react"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"

import { CanvasNodeComponent } from "@/components/editor/canvas-node"
import { ShapePanel } from "@/components/editor/shape-panel"
import {
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

  return (
    <div
      className="relative h-full min-h-0 w-full flex-1"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
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
        <MiniMap
          bgColor="var(--bg-surface)"
          maskColor="color-mix(in srgb, var(--bg-base) 70%, transparent)"
          nodeColor="var(--bg-elevated)"
          pannable
          zoomable
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  )
}
