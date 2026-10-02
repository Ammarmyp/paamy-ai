import type { Edge, Node } from "@xyflow/react"

/**
 * Stored fill key for the theme-aware default/neutral node.
 * Rendered via `--node-neutral-fill` / `--node-neutral-text`.
 */
export const NEUTRAL_NODE_FILL = "#1F1F1F"

/**
 * Node fill + contrasting text color pairs for the canvas color picker.
 * The first (neutral) entry adapts to light/dark at render time; the rest
 * are intentional design colors the user can apply on the canvas.
 */
export const NODE_COLORS = [
  { fill: NEUTRAL_NODE_FILL, text: "#EDEDED" },
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

/** Resolve a stored fill to paint colors (neutral follows active theme). */
export function resolveNodePaint(fill: string): { fill: string; text: string } {
  if (fill === NEUTRAL_NODE_FILL) {
    return {
      fill: "var(--node-neutral-fill)",
      text: "var(--node-neutral-text)",
    }
  }

  const match = NODE_COLORS.find((entry) => entry.fill === fill)
  if (match) {
    return { fill: match.fill, text: match.text }
  }

  return {
    fill: "var(--node-neutral-fill)",
    text: "var(--node-neutral-text)",
  }
}

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

/** Theme-aware default edge stroke (see `--canvas-edge` in globals.css). */
export const DEFAULT_EDGE_COLOR = "var(--canvas-edge)"

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

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string
}

export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">
