import { NextResponse } from "next/server"

import { requireUserId } from "@/lib/api-auth"
import {
  findCollaboratorByEmail,
  inviteCollaborator,
  isValidCollaboratorEmail,
  listEnrichedCollaborators,
  normalizeCollaboratorEmail,
  removeCollaborator,
} from "@/lib/collaborators"
import { enrichEmailsWithClerkProfiles } from "@/lib/clerk-users"
import { getClerkIdentity, userHasProjectAccess } from "@/lib/project-access"
import { findProjectById } from "@/lib/projects"

interface CollaboratorsRouteContext {
  params: Promise<{ projectId: string }>
}

export async function GET(
  _request: Request,
  context: CollaboratorsRouteContext,
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

  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const collaborators = await listEnrichedCollaborators(projectId)
  const canManage = project.ownerId === identity.userId

  return NextResponse.json({
    projectId,
    canManage,
    collaborators,
  })
}

export async function POST(
  request: Request,
  context: CollaboratorsRouteContext,
) {
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

  if (!isRecord(body) || typeof body.email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const email = normalizeCollaboratorEmail(body.email)
  if (!isValidCollaboratorEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
  }

  const existing = await findCollaboratorByEmail(projectId, email)
  if (existing) {
    return NextResponse.json(
      { error: "Collaborator already invited" },
      { status: 409 },
    )
  }

  const created = await inviteCollaborator({ projectId, email })
  const profiles = await enrichEmailsWithClerkProfiles([email])
  const profile = profiles.get(email)

  return NextResponse.json(
    {
      collaborator: {
        id: created.id,
        email: created.email,
        name: profile?.name ?? null,
        imageUrl: profile?.imageUrl ?? null,
        createdAt: created.createdAt,
      },
    },
    { status: 201 },
  )
}

export async function DELETE(
  request: Request,
  context: CollaboratorsRouteContext,
) {
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

  if (!isRecord(body) || typeof body.email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const email = normalizeCollaboratorEmail(body.email)
  const removed = await removeCollaborator(projectId, email)
  if (!removed) {
    return NextResponse.json(
      { error: "Collaborator not found" },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
