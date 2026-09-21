"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

interface StarterTemplatesUiContextValue {
  isOpen: boolean
  open: () => void
  setOpen: (open: boolean) => void
}

const StarterTemplatesUiContext =
  createContext<StarterTemplatesUiContextValue | null>(null)

export function StarterTemplatesUiProvider({
  children,
}: {
  children: ReactNode
}) {
  const [isOpen, setOpen] = useState(false)
  const value = useMemo(
    () => ({
      isOpen,
      open: () => setOpen(true),
      setOpen,
    }),
    [isOpen, setOpen],
  )

  return (
    <StarterTemplatesUiContext.Provider value={value}>
      {children}
    </StarterTemplatesUiContext.Provider>
  )
}

export function useStarterTemplatesUi(): StarterTemplatesUiContextValue {
  const context = useContext(StarterTemplatesUiContext)
  if (!context) {
    throw new Error(
      "useStarterTemplatesUi must be used within StarterTemplatesUiProvider",
    )
  }
  return context
}
