"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

interface AiSidebarUiContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setOpen: (open: boolean) => void
}

const AiSidebarUiContext = createContext<AiSidebarUiContextValue | null>(null)

export function AiSidebarUiProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const value = useMemo(
    () => ({
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((open) => !open),
      setOpen,
    }),
    [isOpen],
  )

  return (
    <AiSidebarUiContext.Provider value={value}>
      {children}
    </AiSidebarUiContext.Provider>
  )
}

export function useAiSidebarUi(): AiSidebarUiContextValue {
  const context = useContext(AiSidebarUiContext)
  if (!context) {
    throw new Error("useAiSidebarUi must be used within AiSidebarUiProvider")
  }
  return context
}
