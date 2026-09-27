import { prisma } from "@/lib/prisma"

export async function createTaskRun(input: {
  runId: string
  projectId: string
  userId: string
}) {
  return prisma.orm.public.TaskRun.create({
    runId: input.runId,
    projectId: input.projectId,
    userId: input.userId,
  })
}

export async function findOwnedTaskRun(runId: string, userId: string) {
  return prisma.orm.public.TaskRun.where({
    runId,
    userId,
  }).first()
}
