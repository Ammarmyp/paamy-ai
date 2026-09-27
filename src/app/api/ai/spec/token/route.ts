import { auth } from "@trigger.dev/sdk"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireUserId } from "@/lib/api-auth"
import { findOwnedTaskRun } from "@/lib/task-runs"

const specTokenRequestSchema = z.object({
  runId: z.string().trim().min(1),
})

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

  const parsed = specTokenRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 })
  }

  const { runId } = parsed.data

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
      expirationTime: "1h",
    })

    return NextResponse.json({ token: publicToken })
  } catch (error) {
    console.error("[ai/spec/token POST] failed to mint public token", error)
    return NextResponse.json(
      { error: "Failed to create access token" },
      { status: 502 },
    )
  }
}
