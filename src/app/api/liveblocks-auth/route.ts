import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { requireUserId } from "@/lib/api-auth"
import { getCursorColor, getLiveblocksClient } from "@/lib/liveblocks"
import { getClerkIdentity, userHasProjectAccess } from "@/lib/project-access"

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

  if (!isRecord(body) || typeof body.room !== "string" || !body.room.trim()) {
    return NextResponse.json({ error: "Room is required" }, { status: 400 })
  }

  // Project ID is the Liveblocks room ID.
  const roomId = body.room.trim()

  const hasAccess = await userHasProjectAccess(roomId, identity)
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const liveblocks = getLiveblocksClient()

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  })

  const user = await currentUser()
  const name = displayNameFromClerkUser(user) ?? identity.email ?? "Anonymous"
  const avatar = user?.imageUrl ?? ""
  const color = getCursorColor(identity.userId)

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: {
      name,
      avatar,
      color,
    },
  })

  session.allow(roomId, session.FULL_ACCESS)

  const { status, body: tokenBody } = await session.authorize()
  return new Response(tokenBody, { status })
}

function displayNameFromClerkUser(
  user: Awaited<ReturnType<typeof currentUser>>,
): string | null {
  if (!user) {
    return null
  }

  if (user.fullName?.trim()) {
    return user.fullName.trim()
  }

  const parts = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))

  if (parts.length > 0) {
    return parts.join(" ")
  }

  if (user.username?.trim()) {
    return user.username.trim()
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
