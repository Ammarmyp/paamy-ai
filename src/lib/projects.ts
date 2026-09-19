import { prisma } from "@/lib/prisma"
import type { ProjectListItem } from "@/lib/project-types"

export const DEFAULT_PROJECT_NAME = "Untitled Project"
export const SIDEBAR_PROJECT_LIMIT = 100

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export interface ProjectListPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ProjectRecord = Awaited<ReturnType<typeof fetchOwnedPage>>[number]

export function toProjectListItem(
  project: Pick<ProjectRecord, "id" | "name">,
  owned: boolean,
): ProjectListItem {
  return {
    id: project.id,
    name: project.name,
    owned,
  }
}

export function parseProjectListPagination(searchParams: URLSearchParams): {
  page: number
  limit: number
  offset: number
} {
  const rawPage = Number(searchParams.get("page") ?? DEFAULT_PAGE)
  const rawLimit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT)

  const page =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : DEFAULT_PAGE
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(rawLimit)))
    : DEFAULT_LIMIT

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  }
}

export async function listOwnedProjects(
  ownerId: string,
  page: number,
  limit: number,
  offset: number,
): Promise<{ projects: Awaited<ReturnType<typeof fetchOwnedPage>>; pagination: ProjectListPagination }> {
  const [projects, totals] = await Promise.all([
    fetchOwnedPage(ownerId, limit, offset),
    prisma.orm.public.Project.where({ ownerId }).aggregate((aggregate) => ({
      total: aggregate.count(),
    })),
  ])

  const total = totals.total
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  return {
    projects,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

async function fetchOwnedPage(ownerId: string, limit: number, offset: number) {
  return prisma.orm.public.Project.where({ ownerId })
    .orderBy((project) => project.createdAt.desc())
    .limit(limit)
    .offset(offset)
    .all()
}

export async function listSharedProjects(email: string): Promise<ProjectRecord[]> {
  const collaborations = await prisma.orm.public.ProjectCollaborator.where({
    email,
  })
    .include("project")
    .orderBy((collaborator) => collaborator.createdAt.desc())
    .all()

  return collaborations.map((collaboration) => collaboration.project)
}

export async function createProject(input: {
  id?: string
  ownerId: string
  name: string
  description?: string | null
}) {
  if (input.id) {
    return prisma.orm.public.Project.create({
      id: input.id,
      ownerId: input.ownerId,
      name: input.name,
      description: input.description ?? null,
    })
  }

  return prisma.orm.public.Project.create({
    ownerId: input.ownerId,
    name: input.name,
    description: input.description ?? null,
  })
}

export async function findProjectById(projectId: string) {
  return prisma.orm.public.Project.where({ id: projectId }).first()
}

export async function renameProject(projectId: string, name: string) {
  return prisma.orm.public.Project.where({ id: projectId })
    .select(
      "id",
      "ownerId",
      "name",
      "description",
      "status",
      "canvasJsonPath",
      "createdAt",
      "updatedAt",
    )
    .update({ name })
}

export async function deleteProject(projectId: string) {
  return prisma.orm.public.Project.where({ id: projectId }).delete()
}

export async function loadEditorProjectLists(input: {
  userId: string
  email: string | null
}): Promise<{
  ownedProjects: ProjectListItem[]
  sharedProjects: ProjectListItem[]
}> {
  const [{ projects: owned }, shared] = await Promise.all([
    listOwnedProjects(input.userId, 1, SIDEBAR_PROJECT_LIMIT, 0),
    input.email ? listSharedProjects(input.email) : Promise.resolve([]),
  ])

  return {
    ownedProjects: owned.map((project) => toProjectListItem(project, true)),
    sharedProjects: shared.map((project) => toProjectListItem(project, false)),
  }
}
