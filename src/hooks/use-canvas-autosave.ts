"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  serializeCanvasForSave,
  type CanvasSnapshot,
} from "@/lib/canvas-storage"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error"

const DEFAULT_DEBOUNCE_MS = 1500

interface UseCanvasAutosaveOptions {
  projectId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  /** When false, changes are ignored (e.g. while hydrating from blob). */
  enabled?: boolean
  debounceMs?: number
}

interface UseCanvasAutosaveResult {
  status: CanvasSaveStatus
  saveNow: () => Promise<void>
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveResult {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle")
  const lastSavedJsonRef = useRef<string | null>(null)
  const isSavingRef = useRef(false)
  const pendingSnapshotRef = useRef<CanvasSnapshot | null>(null)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const projectIdRef = useRef(projectId)

  nodesRef.current = nodes
  edgesRef.current = edges
  projectIdRef.current = projectId

  const saveSnapshot = useCallback(async (snapshot: CanvasSnapshot) => {
    const nextJson = JSON.stringify(snapshot)
    if (nextJson === lastSavedJsonRef.current) {
      setStatus((current) => (current === "idle" ? current : "saved"))
      return
    }

    if (isSavingRef.current) {
      pendingSnapshotRef.current = snapshot
      return
    }

    isSavingRef.current = true
    setStatus("saving")

    try {
      const response = await fetch(
        `/api/projects/${projectIdRef.current}/canvas`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: nextJson,
        },
      )

      if (!response.ok) {
        throw new Error(`Save failed (${response.status})`)
      }

      lastSavedJsonRef.current = nextJson
      setStatus("saved")
    } catch {
      setStatus("error")
    } finally {
      isSavingRef.current = false

      const pending = pendingSnapshotRef.current
      if (pending) {
        pendingSnapshotRef.current = null
        void saveSnapshot(pending)
      }
    }
  }, [])

  const saveNow = useCallback(async () => {
    const snapshot = serializeCanvasForSave(nodesRef.current, edgesRef.current)
    await saveSnapshot(snapshot)
  }, [saveSnapshot])

  useEffect(() => {
    lastSavedJsonRef.current = null
    setStatus("idle")
  }, [projectId])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const snapshot = serializeCanvasForSave(nodes, edges)
    const nextJson = JSON.stringify(snapshot)

    if (lastSavedJsonRef.current === null) {
      // Seed baseline so the initial room state does not immediately autosave.
      lastSavedJsonRef.current = nextJson
      return
    }

    if (nextJson === lastSavedJsonRef.current) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void saveSnapshot(snapshot)
    }, debounceMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [projectId, nodes, edges, enabled, debounceMs, saveSnapshot])

  return { status, saveNow }
}
