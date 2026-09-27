import { tasks } from "@trigger.dev/sdk"
import { NextResponse } from "next/server"

import { requireUserId } from "@/lib/api-auth"
import { getAccessibleProject, getClerkIdentity } from "@/lib/project-access"
import { createTaskRun } from "@/lib/task-runs"
import type { generateSpecTask } from "@/trigger/generate-spec"
import { generateSpecRequestSchema } from "@/types/spec-generation"

export async function POST(request: Request) {
  const authResult = await requireUserId()
  if (authResult.error) {
    return authResult.error
  }

  const identity = await getClerkIdentity()
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = generateSpecRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data
  // Room id doubles as project id — never trust a client-supplied projectId.
  const projectId = roomId

  const project = await getAccessibleProject(projectId, identity)
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  let handle: { id: string }
  try {
    handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
      projectId,
      roomId,
      chatHistory,
      nodes,
      edges,
    })
  } catch (error) {
    console.error("[ai/spec POST] failed to trigger generate-spec", error)
    return NextResponse.json(
      { error: "Failed to trigger spec task" },
      { status: 502 },
    )
  }

  try {
    await createTaskRun({
      runId: handle.id,
      projectId,
      userId: identity.userId,
    })
  } catch (error) {
    console.error("[ai/spec POST] failed to store TaskRun", error)
    return NextResponse.json(
      { error: "Failed to record task run" },
      { status: 502 },
    )
  }

  return NextResponse.json({ runId: handle.id }, { status: 201 })
}
