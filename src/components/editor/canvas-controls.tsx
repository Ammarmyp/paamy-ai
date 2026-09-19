"use client"

import type { LucideIcon } from "lucide-react"
import {
  Maximize2,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { useReactFlow } from "@xyflow/react"
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react"

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { cn } from "@/lib/utils"

const ZOOM_DURATION_MS = 200

export function CanvasControls() {
  const reactFlow = useReactFlow()
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  useKeyboardShortcuts({
    reactFlow,
    undo,
    redo,
  })

  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-10">
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-elevated/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
        role="toolbar"
        aria-label="Canvas controls"
      >
        <ControlButton
          label="Zoom out"
          icon={ZoomOut}
          onClick={() => {
            void reactFlow.zoomOut({ duration: ZOOM_DURATION_MS })
          }}
        />
        <ControlButton
          label="Fit view"
          icon={Maximize2}
          onClick={() => {
            void reactFlow.fitView({ duration: ZOOM_DURATION_MS })
          }}
        />
        <ControlButton
          label="Zoom in"
          icon={ZoomIn}
          onClick={() => {
            void reactFlow.zoomIn({ duration: ZOOM_DURATION_MS })
          }}
        />

        <div
          className="mx-1 h-5 w-px shrink-0 bg-surface-border"
          aria-hidden
        />

        <ControlButton
          label="Undo"
          icon={Undo2}
          disabled={!canUndo}
          onClick={undo}
        />
        <ControlButton
          label="Redo"
          icon={Redo2}
          disabled={!canRedo}
          onClick={redo}
        />
      </div>
    </div>
  )
}

function ControlButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-copy-secondary transition-colors",
        disabled
          ? "cursor-not-allowed text-copy-faint opacity-40"
          : "hover:bg-subtle hover:text-copy-primary",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
