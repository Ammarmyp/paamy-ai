import { auth } from "@trigger.dev/sdk"
import { NextResponse } from "next/server"

import { requireUserId } from "@/lib/api-auth"
import { findOwnedTaskRun } from "@/lib/task-runs"

export async function POST(request: Request) {
  const authResult = await requireUserId()
  if (authResult.error) {
    return authResult.error
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const runId = parseRunId(body)
  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 })
  }

  const taskRun = await findOwnedTaskRun(runId, authResult.userId)
  if (!taskRun) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 })
  }

  try {
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
      expirationTime: "15m",
    })

    return NextResponse.json({ token: publicToken })
  } catch (error) {
    console.error("[ai/design/token POST] failed to mint public token", error)
    return NextResponse.json(
      { error: "Failed to create access token" },
      { status: 502 },
    )
  }
}

function parseRunId(body: unknown): string | null {
  if (!isRecord(body)) {
    return null
  }

  const runId = typeof body.runId === "string" ? body.runId.trim() : ""
  return runId.length > 0 ? runId : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
