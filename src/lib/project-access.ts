import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { findProjectById } from "@/lib/projects"

export interface ClerkIdentity {
  userId: string
  email: string | null
}

export async function getClerkIdentity(): Promise<ClerkIdentity | null> {
  const { userId, isAuthenticated } = await auth()
  if (!isAuthenticated || !userId) {
    return null
  }

  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null

  return { userId, email }
}

async function isProjectCollaborator(
  projectId: string,
  email: string,
): Promise<boolean> {
  const collaboration = await prisma.orm.public.ProjectCollaborator.where({
    projectId,
    email,
  }).first()

  return collaboration !== null
}

export async function userHasProjectAccess(
  projectId: string,
  identity: ClerkIdentity,
): Promise<boolean> {
  const project = await getAccessibleProject(projectId, identity)
  return project !== null
}

export async function getAccessibleProject(
  projectId: string,
  identity: ClerkIdentity,
) {
  const project = await findProjectById(projectId)
  if (!project) {
    return null
  }

  if (project.ownerId === identity.userId) {
    return project
  }

  if (!identity.email) {
    return null
  }

  const isCollaborator = await isProjectCollaborator(projectId, identity.email)
  return isCollaborator ? project : null
}
