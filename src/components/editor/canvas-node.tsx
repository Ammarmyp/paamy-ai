"use client"

import type { NodeProps } from "@xyflow/react"

import {
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  type CanvasNode,
} from "@/types/canvas"

export function CanvasNodeComponent({ data, width, height }: NodeProps<CanvasNode>) {
  const palette =
    NODE_COLORS.find((entry) => entry.fill === data.color) ?? DEFAULT_NODE_COLOR

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-xl border border-surface-border px-3 text-center text-sm"
      style={{
        width: width ?? 180,
        height: height ?? 100,
        backgroundColor: palette.fill,
        color: palette.text,
      }}
    >
      <span className="truncate">{data.label}</span>
    </div>
  )
}
