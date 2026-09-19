import { NextResponse } from "next/server"

import { requireUserId } from "@/lib/api-auth"
import {
  DEFAULT_PROJECT_NAME,
  createProject,
  listOwnedProjects,
  parseProjectListPagination,
} from "@/lib/projects"

export async function GET(request: Request) {
  const authResult = await requireUserId()
  if (authResult.error) {
    return authResult.error
  }

  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = parseProjectListPagination(searchParams)
  const result = await listOwnedProjects(authResult.userId, page, limit, offset)

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const authResult = await requireUserId()
  if (authResult.error) {
    return authResult.error
  }

  let body: unknown = {}
  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
  }

  const payload = isRecord(body) ? body : {}
  const rawName = payload.name
  const name =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName.trim()
      : DEFAULT_PROJECT_NAME

  const rawDescription = payload.description
  const description =
    typeof rawDescription === "string"
      ? rawDescription
      : rawDescription === null
        ? null
        : undefined

  const rawId = payload.id
  if (rawId !== undefined && !isValidProjectRoomId(rawId)) {
    return NextResponse.json(
      { error: "Invalid project id. Use a slug with a short unique suffix." },
      { status: 400 },
    )
  }
  const id = typeof rawId === "string" ? rawId : undefined

  const project = await createProject({
    id,
    ownerId: authResult.userId,
    name,
    description,
  })

  return NextResponse.json({ project }, { status: 201 })
}

const PROJECT_ROOM_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)+$/

function isValidProjectRoomId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 3 &&
    value.length <= 128 &&
    PROJECT_ROOM_ID_PATTERN.test(value)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
