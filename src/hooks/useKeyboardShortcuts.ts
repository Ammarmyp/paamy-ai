"use client"

import { useEffect } from "react"
import type { ReactFlowInstance } from "@xyflow/react"

const ZOOM_DURATION_MS = 200

interface UseKeyboardShortcutsOptions {
  reactFlow: ReactFlowInstance
  undo: () => void
  redo: () => void
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const tagName = target.tagName
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT"
}

export function useKeyboardShortcuts({
  reactFlow,
  undo,
  redo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return
      }

      const isMod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (isMod && key === "z" && event.shiftKey) {
        event.preventDefault()
        redo()
        return
      }

      if (isMod && key === "z") {
        event.preventDefault()
        undo()
        return
      }

      if (isMod && key === "y") {
        event.preventDefault()
        redo()
        return
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        void reactFlow.zoomIn({ duration: ZOOM_DURATION_MS })
        return
      }

      if (event.key === "-") {
        event.preventDefault()
        void reactFlow.zoomOut({ duration: ZOOM_DURATION_MS })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [reactFlow, undo, redo])
}
