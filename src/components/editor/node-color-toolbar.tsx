"use client"

import type { CSSProperties, MouseEvent } from "react"

import { cn } from "@/lib/utils"
import { NODE_COLORS, type NodeColor } from "@/types/canvas"

interface NodeColorToolbarProps {
  activeFill: string
  onSelect: (color: NodeColor) => void
}

export function NodeColorToolbar({
  activeFill,
  onSelect,
}: NodeColorToolbarProps) {
  function stopCanvasInteraction(event: MouseEvent) {
    event.stopPropagation()
  }

  return (
    <div
      className="nodrag nopan absolute left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-surface-border bg-elevated px-2 py-1.5"
      style={{ bottom: "calc(100% + 12px)" }}
      onMouseDown={stopCanvasInteraction}
      onPointerDown={stopCanvasInteraction}
      role="toolbar"
      aria-label="Node color"
    >
      {NODE_COLORS.map((entry) => {
        const isActive = entry.fill === activeFill

        return (
          <button
            key={entry.fill}
            type="button"
            aria-label={`Apply node color ${entry.fill}`}
            aria-pressed={isActive}
            className={cn(
              "h-4 w-4 shrink-0 rounded-full border transition-[box-shadow,transform] duration-150",
              "hover:shadow-[0_0_4px_1px_var(--swatch-glow)]",
              isActive
                ? "scale-110 border-copy-primary ring-1 ring-copy-primary"
                : "border-border-subtle",
            )}
            style={
              {
                backgroundColor: entry.fill,
                "--swatch-glow": entry.text,
              } as CSSProperties
            }
            onClick={() => onSelect(entry)}
          />
        )
      })}
    </div>
  )
}
