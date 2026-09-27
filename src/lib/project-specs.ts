import { prisma } from "@/lib/prisma"
import { uploadSpecMarkdown } from "@/lib/spec-storage"

export async function createProjectSpec(input: {
  id?: string
  projectId: string
  filePath: string
}) {
  if (input.id) {
    return prisma.orm.public.ProjectSpec.create({
      id: input.id,
      projectId: input.projectId,
      filePath: input.filePath,
    })
  }

  return prisma.orm.public.ProjectSpec.create({
    projectId: input.projectId,
    filePath: input.filePath,
  })
}

export async function findProjectSpec(projectId: string, specId: string) {
  return prisma.orm.public.ProjectSpec.where({
    id: specId,
    projectId,
  }).first()
}

export function getSpecFilename(specId: string): string {
  return `spec-${specId}.md`
}

export async function listProjectSpecs(projectId: string) {
  const rows = await prisma.orm.public.ProjectSpec.where({ projectId })
    .orderBy((spec) => spec.createdAt.desc())
    .all()

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    filename: getSpecFilename(row.id),
  }))
}

export async function persistGeneratedSpec(input: {
  projectId: string
  markdown: string
}) {
  const specId = crypto.randomUUID()
  const filePath = await uploadSpecMarkdown(
    input.projectId,
    specId,
    input.markdown,
  )

  const record = await createProjectSpec({
    id: specId,
    projectId: input.projectId,
    filePath,
  })

  return {
    spec: Array.isArray(record) ? record[0]! : record,
    markdown: input.markdown,
  }
}
