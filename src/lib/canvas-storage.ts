import { get, put } from "@vercel/blob"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export interface CanvasSnapshot {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export function canvasBlobPathname(projectId: string): string {
  return `canvas/${projectId}.json`
}

export async function uploadCanvasSnapshot(
  projectId: string,
  snapshot: CanvasSnapshot,
): Promise<string> {
  const blob = await put(
    canvasBlobPathname(projectId),
    JSON.stringify(snapshot),
    {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    },
  )

  return blob.url
}

export async function fetchCanvasSnapshotFromUrl(
  url: string,
): Promise<CanvasSnapshot> {
  const result = await get(url, {
    access: "private",
    useCache: false,
  })

  if (!result || result.statusCode !== 200 || !result.stream) {
    const status = result?.statusCode ?? "null"
    throw new Error(`Failed to fetch canvas blob (${status})`)
  }

  const payload: unknown = await new Response(result.stream).json()
  return parseCanvasSnapshot(payload)
}

export function parseCanvasSnapshot(value: unknown): CanvasSnapshot {
  if (!isRecord(value)) {
    throw new Error("Invalid canvas snapshot")
  }

  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    throw new Error("Canvas snapshot must include nodes and edges arrays")
  }

  return {
    nodes: value.nodes as CanvasNode[],
    edges: value.edges as CanvasEdge[],
  }
}

export function serializeCanvasForSave(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): CanvasSnapshot {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type ?? "canvasNode",
      position: node.position,
      width: node.width,
      height: node.height,
      data: {
        label: node.data.label,
        color: node.data.color,
        shape: node.data.shape,
      },
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      type: edge.type ?? "canvasEdge",
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
      data: {
        label: edge.data?.label ?? "",
      },
    })),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
