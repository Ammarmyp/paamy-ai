import { NextResponse } from "next/server"

import { requireUserId } from "@/lib/api-auth"
import { getAccessibleProject, getClerkIdentity } from "@/lib/project-access"
import { listProjectSpecs } from "@/lib/project-specs"
import { findProjectById } from "@/lib/projects"

interface ProjectSpecsRouteContext {
  params: Promise<{ projectId: string }>
}

export async function GET(
  _request: Request,
  context: ProjectSpecsRouteContext,
) {
  const authResult = await requireUserId()
  if (authResult.error) {
    return authResult.error
  }

  const identity = await getClerkIdentity()
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await context.params

  const project = await findProjectById(projectId)
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const accessible = await getAccessibleProject(projectId, identity)
  if (!accessible) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const specs = await listProjectSpecs(projectId)

  return NextResponse.json({ projectId, specs })
}
