import { NextResponse } from "next/server"

import { requireUserId } from "@/lib/api-auth"
import {
  fetchCanvasSnapshotFromUrl,
  parseCanvasSnapshot,
  serializeCanvasForSave,
  uploadCanvasSnapshot,
} from "@/lib/canvas-storage"
import { getClerkIdentity, getAccessibleProject } from "@/lib/project-access"
import { findProjectById, updateProjectCanvasJsonPath } from "@/lib/projects"

interface CanvasRouteContext {
  params: Promise<{ projectId: string }>
}

export async function GET(
  _request: Request,
  context: CanvasRouteContext,
) {
  const authResult = await requireUserId()
  if (authResult.error) {
    return authResult.error
  }

  const identity = await getClerkIdentity()
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await context.params
  const project = await findProjectById(projectId)
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const accessible = await getAccessibleProject(projectId, identity)
  if (!accessible) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  if (!accessible.canvasJsonPath) {
    return NextResponse.json({ error: "No saved canvas" }, { status: 404 })
  }

  try {
    const canvas = await fetchCanvasSnapshotFromUrl(accessible.canvasJsonPath)
    return NextResponse.json({ canvas })
  } catch (error) {
    console.error("[canvas GET] failed to load snapshot", error)
    return NextResponse.json(
      { error: "Failed to load canvas snapshot" },
      { status: 502 },
    )
  }
}

export async function PUT(request: Request, context: CanvasRouteContext) {
  const authResult = await requireUserId()
  if (authResult.error) {
    return authResult.error
  }

  const identity = await getClerkIdentity()
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await context.params
  const project = await findProjectById(projectId)
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const accessible = await getAccessibleProject(projectId, identity)
  if (!accessible) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  let snapshot
  try {
    snapshot = parseCanvasRequestBody(body)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid canvas payload",
      },
      { status: 400 },
    )
  }

  try {
    const blobUrl = await uploadCanvasSnapshot(projectId, snapshot)
    const updated = await updateProjectCanvasJsonPath(projectId, blobUrl)
    const nextProject = Array.isArray(updated) ? updated[0] : updated

    return NextResponse.json({
      canvasJsonPath: nextProject?.canvasJsonPath ?? blobUrl,
    })
  } catch (error) {
    console.error("[canvas PUT] failed to save snapshot", error)
    return NextResponse.json(
      { error: "Failed to save canvas snapshot" },
      { status: 502 },
    )
  }
}

function parseCanvasRequestBody(body: unknown) {
  if (!isRecord(body)) {
    throw new Error("Invalid JSON body")
  }

  // Accept either `{ nodes, edges }` or `{ canvas: { nodes, edges } }`.
  const payload = isRecord(body.canvas) ? body.canvas : body
  const snapshot = parseCanvasSnapshot(payload)
  return serializeCanvasForSave(snapshot.nodes, snapshot.edges)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
