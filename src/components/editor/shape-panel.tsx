"use client"

import type { DragEvent } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
} from "lucide-react"

import {
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  SHAPE_DRAG_MIME,
  type NodeShape,
  type ShapeDragPayload,
} from "@/types/canvas"

const SHAPE_ICONS: Record<NodeShape, LucideIcon> = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Cylinder,
  hexagon: Hexagon,
}

export function ShapePanel() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-elevated/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
        role="toolbar"
        aria-label="Canvas shapes"
      >
        {NODE_SHAPES.map((shape) => (
          <ShapeButton key={shape} shape={shape} />
        ))}
      </div>
    </div>
  )
}

function ShapeButton({ shape }: { shape: NodeShape }) {
  const Icon = SHAPE_ICONS[shape]
  const size = SHAPE_DEFAULT_SIZES[shape]

  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
    const payload: ShapeDragPayload = {
      shape,
      width: size.width,
      height: size.height,
    }

    event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload))
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      title={shape}
      aria-label={`Drag ${shape} onto canvas`}
      className="flex h-9 w-9 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary"
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
