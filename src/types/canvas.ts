import type { Edge, Node } from "@xyflow/react"

/**
 * Node fill + contrasting text color pairs for the dark canvas.
 * Defined in ui-context.md.
 */
export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const

export type NodeColor = (typeof NODE_COLORS)[number]

export const DEFAULT_NODE_COLOR: NodeColor = NODE_COLORS[0]

/**
 * Supported canvas node shapes (ui-context.md).
 */
export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

export type NodeShape = (typeof NODE_SHAPES)[number]

export const DEFAULT_NODE_SHAPE: NodeShape = "rectangle"

export const DEFAULT_EDGE_COLOR = "#f8fafc"

/**
 * Default node dimensions per shape for drag-and-drop creation.
 * Rectangles are wider than tall; circles are square; diamonds are
 * slightly larger so labels have room.
 */
export const SHAPE_DEFAULT_SIZES: Record<
  NodeShape,
  { width: number; height: number }
> = {
  rectangle: { width: 180, height: 100 },
  diamond: { width: 140, height: 140 },
  circle: { width: 100, height: 100 },
  pill: { width: 180, height: 72 },
  cylinder: { width: 120, height: 140 },
  hexagon: { width: 140, height: 120 },
}

export const SHAPE_DRAG_MIME = "application/paamy-shape"

export interface ShapeDragPayload {
  shape: NodeShape
  width: number
  height: number
}

export interface CanvasNodeData extends Record<string, unknown> {
  label: string
  color: string
  shape: NodeShape
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">

export type CanvasEdge = Edge<Record<string, unknown>, "canvasEdge">
