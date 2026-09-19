import { NextResponse } from "next/server"

import { requireUserId } from "@/lib/api-auth"
import { deleteProject, findProjectById, renameProject } from "@/lib/projects"

interface ProjectRouteContext {
  params: Promise<{ projectId: string }>
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const authResult = await requireUserId()
  if (authResult.error) {
    return authResult.error
  }

  const { projectId } = await context.params
  const project = await findProjectById(projectId)

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  if (project.ownerId !== authResult.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!isRecord(body) || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const updated = await renameProject(projectId, body.name.trim())
  const nextProject = Array.isArray(updated) ? updated[0] : updated

  return NextResponse.json({ project: nextProject })
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const authResult = await requireUserId()
  if (authResult.error) {
    return authResult.error
  }

  const { projectId } = await context.params
  const project = await findProjectById(projectId)

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  if (project.ownerId !== authResult.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await deleteProject(projectId)

  return NextResponse.json({ success: true })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
