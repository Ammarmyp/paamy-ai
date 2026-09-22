"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"

interface CanvasSaveUiValue {
  status: CanvasSaveStatus
  setStatus: (status: CanvasSaveStatus) => void
  saveNow: () => Promise<void>
  registerSaveNow: (saveNow: (() => Promise<void>) | null) => void
}

const CanvasSaveUiContext = createContext<CanvasSaveUiValue | null>(null)

export function CanvasSaveUiProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle")
  const saveNowRef = useRef<(() => Promise<void>) | null>(null)

  const registerSaveNow = useCallback(
    (next: (() => Promise<void>) | null) => {
      saveNowRef.current = next
    },
    [],
  )

  const saveNow = useCallback(async () => {
    await saveNowRef.current?.()
  }, [])

  const value = useMemo(
    () => ({
      status,
      setStatus,
      saveNow,
      registerSaveNow,
    }),
    [status, saveNow, registerSaveNow],
  )

  return (
    <CanvasSaveUiContext.Provider value={value}>
      {children}
    </CanvasSaveUiContext.Provider>
  )
}

export function useCanvasSaveUi() {
  const context = useContext(CanvasSaveUiContext)
  if (!context) {
    throw new Error("useCanvasSaveUi must be used within CanvasSaveUiProvider")
  }
  return context
}
