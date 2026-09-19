import { enrichEmailsWithClerkProfiles } from "@/lib/clerk-users"
import { prisma } from "@/lib/prisma"

export interface CollaboratorRecord {
  id: string
  email: string
  createdAt: string
}

export interface EnrichedCollaborator {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
  createdAt: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeCollaboratorEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function isValidCollaboratorEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}

export async function listCollaborators(
  projectId: string,
): Promise<CollaboratorRecord[]> {
  const rows = await prisma.orm.public.ProjectCollaborator.where({ projectId })
    .orderBy((collaborator) => collaborator.createdAt.asc())
    .all()

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    createdAt: row.createdAt,
  }))
}

export async function listEnrichedCollaborators(
  projectId: string,
): Promise<EnrichedCollaborator[]> {
  const collaborators = await listCollaborators(projectId)
  const profiles = await enrichEmailsWithClerkProfiles(
    collaborators.map((collaborator) => collaborator.email),
  )

  return collaborators.map((collaborator) => {
    const profile = profiles.get(collaborator.email)
    return {
      id: collaborator.id,
      email: collaborator.email,
      name: profile?.name ?? null,
      imageUrl: profile?.imageUrl ?? null,
      createdAt: collaborator.createdAt,
    }
  })
}

export async function findCollaboratorByEmail(
  projectId: string,
  email: string,
): Promise<CollaboratorRecord | null> {
  const row = await prisma.orm.public.ProjectCollaborator.where({
    projectId,
    email,
  }).first()

  if (!row) {
    return null
  }

  return {
    id: row.id,
    email: row.email,
    createdAt: row.createdAt,
  }
}

export async function inviteCollaborator(input: {
  projectId: string
  email: string
}): Promise<CollaboratorRecord> {
  const created = await prisma.orm.public.ProjectCollaborator.create({
    projectId: input.projectId,
    email: input.email,
  })

  return {
    id: created.id,
    email: created.email,
    createdAt: created.createdAt,
  }
}

export async function removeCollaborator(
  projectId: string,
  email: string,
): Promise<boolean> {
  const existing = await findCollaboratorByEmail(projectId, email)
  if (!existing) {
    return false
  }

  await prisma.orm.public.ProjectCollaborator.where({
    projectId,
    email,
  }).delete()

  return true
}
