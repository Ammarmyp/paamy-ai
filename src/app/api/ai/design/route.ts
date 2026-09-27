import { auth, tasks } from "@trigger.dev/sdk"
import { NextResponse } from "next/server"

import { requireUserId } from "@/lib/api-auth"
import { getAccessibleProject, getClerkIdentity } from "@/lib/project-access"
import { createTaskRun } from "@/lib/task-runs"
import type { designAgentTask } from "@/trigger/design-agent"

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

  const payload = parseDesignRequestBody(body)
  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 })
  }

  const { prompt, roomId, projectId } = payload

  if (roomId !== projectId) {
    return NextResponse.json(
      { error: "roomId must match projectId" },
      { status: 400 },
    )
  }

  const project = await getAccessibleProject(projectId, identity)
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  let handle: { id: string }
  try {
    handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt,
      roomId,
    })
  } catch (error) {
    console.error("[ai/design POST] failed to trigger design-agent", error)
    return NextResponse.json(
      { error: "Failed to trigger design task" },
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
    console.error("[ai/design POST] failed to store TaskRun", error)
    return NextResponse.json(
      { error: "Failed to record task run" },
      { status: 502 },
    )
  }

  try {
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [handle.id],
        },
      },
      expirationTime: "15m",
    })

    return NextResponse.json(
      { runId: handle.id, publicToken },
      { status: 201 },
    )
  } catch (error) {
    console.error("[ai/design POST] failed to mint public token", error)
    return NextResponse.json(
      { error: "Failed to create access token" },
      { status: 502 },
    )
  }
}

function parseDesignRequestBody(body: unknown):
  | { prompt: string; roomId: string; projectId: string }
  | { error: string } {
  if (!isRecord(body)) {
    return { error: "Invalid JSON body" }
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
  if (!prompt) {
    return { error: "prompt is required" }
  }

  const roomId = typeof body.roomId === "string" ? body.roomId.trim() : ""
  if (!roomId) {
    return { error: "roomId is required" }
  }

  // projectId is optional — room id doubles as project id in this app
  const projectIdRaw =
    typeof body.projectId === "string" ? body.projectId.trim() : ""
  const projectId = projectIdRaw.length > 0 ? projectIdRaw : roomId

  return { prompt, roomId, projectId }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
