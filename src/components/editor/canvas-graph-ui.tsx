"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

interface CanvasGraphSnapshot {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

interface CanvasGraphUiValue {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  publishGraph: (snapshot: CanvasGraphSnapshot) => void
}

const EMPTY_NODES: CanvasNode[] = []
const EMPTY_EDGES: CanvasEdge[] = []

const CanvasGraphUiContext = createContext<CanvasGraphUiValue | null>(null)

export function CanvasGraphUiProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<CanvasNode[]>(EMPTY_NODES)
  const [edges, setEdges] = useState<CanvasEdge[]>(EMPTY_EDGES)

  const publishGraph = useCallback((snapshot: CanvasGraphSnapshot) => {
    setNodes(snapshot.nodes)
    setEdges(snapshot.edges)
  }, [])

  const value = useMemo(
    () => ({
      nodes,
      edges,
      publishGraph,
    }),
    [nodes, edges, publishGraph],
  )

  return (
    <CanvasGraphUiContext.Provider value={value}>
      {children}
    </CanvasGraphUiContext.Provider>
  )
}

export function useCanvasGraphSnapshot(): CanvasGraphSnapshot {
  const context = useContext(CanvasGraphUiContext)
  if (!context) {
    return { nodes: EMPTY_NODES, edges: EMPTY_EDGES }
  }
  return { nodes: context.nodes, edges: context.edges }
}

export function usePublishCanvasGraph() {
  const context = useContext(CanvasGraphUiContext)
  if (!context) {
    throw new Error(
      "usePublishCanvasGraph must be used within CanvasGraphUiProvider",
    )
  }
  return context.publishGraph
}
