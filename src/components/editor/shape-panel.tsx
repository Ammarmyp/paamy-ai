"use client"

import { useCallback, useEffect, useState, type DragEvent } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
} from "lucide-react"

import { NodeShapeVisual } from "@/components/editor/node-shape-visual"
import {
  DEFAULT_NODE_COLOR,
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

/** Transparent 1×1 GIF so the browser drag image does not cover the ghost. */
const EMPTY_DRAG_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

interface ShapeDragPreview {
  shape: NodeShape
  width: number
  height: number
  x: number
  y: number
}

export function ShapePanel() {
  const [preview, setPreview] = useState<ShapeDragPreview | null>(null)

  const clearPreview = useCallback(() => {
    setPreview(null)
  }, [])

  const isDraggingPreview = preview !== null

  useEffect(() => {
    if (!isDraggingPreview) {
      return
    }

    function handleDragOver(event: Event) {
      const dragEvent = event as globalThis.DragEvent
      setPreview((current) =>
        current
          ? {
              ...current,
              x: dragEvent.clientX,
              y: dragEvent.clientY,
            }
          : null,
      )
    }

    function handleDragEnd() {
      clearPreview()
    }

    document.addEventListener("dragover", handleDragOver)
    document.addEventListener("dragend", handleDragEnd)
    document.addEventListener("drop", handleDragEnd)

    return () => {
      document.removeEventListener("dragover", handleDragOver)
      document.removeEventListener("dragend", handleDragEnd)
      document.removeEventListener("drop", handleDragEnd)
    }
  }, [isDraggingPreview, clearPreview])

  function handleShapeDragStart(
    event: DragEvent<HTMLButtonElement>,
    shape: NodeShape,
  ) {
    const size = SHAPE_DEFAULT_SIZES[shape]
    const payload: ShapeDragPayload = {
      shape,
      width: size.width,
      height: size.height,
    }

    event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload))
    event.dataTransfer.effectAllowed = "move"

    const ghost = new Image()
    ghost.src = EMPTY_DRAG_IMAGE
    event.dataTransfer.setDragImage(ghost, 0, 0)

    setPreview({
      shape,
      width: size.width,
      height: size.height,
      x: event.clientX,
      y: event.clientY,
    })
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
        <div
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-elevated/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
          role="toolbar"
          aria-label="Canvas shapes"
        >
          {NODE_SHAPES.map((shape) => (
            <ShapeButton
              key={shape}
              shape={shape}
              onDragStart={handleShapeDragStart}
            />
          ))}
        </div>
      </div>

      {preview ? (
        <div
          className="pointer-events-none fixed z-50 opacity-60"
          style={{
            left: preview.x,
            top: preview.y,
          }}
          aria-hidden
        >
          <NodeShapeVisual
            shape={preview.shape}
            width={preview.width}
            height={preview.height}
            fill={DEFAULT_NODE_COLOR.fill}
            textColor={DEFAULT_NODE_COLOR.text}
          />
        </div>
      ) : null}
    </>
  )
}

function ShapeButton({
  shape,
  onDragStart,
}: {
  shape: NodeShape
  onDragStart: (
    event: DragEvent<HTMLButtonElement>,
    shape: NodeShape,
  ) => void
}) {
  const Icon = SHAPE_ICONS[shape]

  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => onDragStart(event, shape)}
      title={shape}
      aria-label={`Drag ${shape} onto canvas`}
      className="flex h-9 w-9 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary"
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
