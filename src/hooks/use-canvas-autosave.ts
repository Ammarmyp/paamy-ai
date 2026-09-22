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
  const inFlightJsonRef = useRef<string | null>(null)
  const isSavingRef = useRef(false)
  const pendingSnapshotRef = useRef<CanvasSnapshot | null>(null)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const projectIdRef = useRef(projectId)

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
    projectIdRef.current = projectId
  })

  const drainSaveQueue = useCallback(async () => {
    if (isSavingRef.current) {
      return
    }

    isSavingRef.current = true

    try {
      while (true) {
        const snapshot = pendingSnapshotRef.current
        if (!snapshot) {
          break
        }

        pendingSnapshotRef.current = null
        const nextJson = JSON.stringify(snapshot)

        if (nextJson === lastSavedJsonRef.current) {
          setStatus((current) => (current === "idle" ? current : "saved"))
          continue
        }

        inFlightJsonRef.current = nextJson
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
          break
        } finally {
          inFlightJsonRef.current = null
        }
      }
    } finally {
      isSavingRef.current = false
    }
  }, [])

  const enqueueSave = useCallback(
    (snapshot: CanvasSnapshot) => {
      const nextJson = JSON.stringify(snapshot)

      // While a save is in flight, queue whenever the body differs from the
      // in-flight snapshot — including reverted states (e.g. back to S0).
      if (isSavingRef.current) {
        if (nextJson !== inFlightJsonRef.current) {
          pendingSnapshotRef.current = snapshot
        }
        return
      }

      if (nextJson === lastSavedJsonRef.current) {
        setStatus((current) => (current === "idle" ? current : "saved"))
        return
      }

      pendingSnapshotRef.current = snapshot
      void drainSaveQueue()
    },
    [drainSaveQueue],
  )

  const saveNow = useCallback(async () => {
    const snapshot = serializeCanvasForSave(nodesRef.current, edgesRef.current)
    const nextJson = JSON.stringify(snapshot)

    if (isSavingRef.current) {
      if (nextJson !== inFlightJsonRef.current) {
        pendingSnapshotRef.current = snapshot
      }
      return
    }

    if (nextJson === lastSavedJsonRef.current) {
      setStatus((current) => (current === "idle" ? current : "saved"))
      return
    }

    pendingSnapshotRef.current = snapshot
    await drainSaveQueue()
  }, [drainSaveQueue])

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

    if (nextJson === lastSavedJsonRef.current && !isSavingRef.current) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      enqueueSave(snapshot)
    }, debounceMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [projectId, nodes, edges, enabled, debounceMs, enqueueSave])

  return { status, saveNow }
}
