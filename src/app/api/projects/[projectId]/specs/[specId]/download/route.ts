import { NextResponse } from "next/server"

import { requireUserId } from "@/lib/api-auth"
import { getAccessibleProject, getClerkIdentity } from "@/lib/project-access"
import { findProjectSpec, getSpecFilename } from "@/lib/project-specs"
import { findProjectById } from "@/lib/projects"
import { fetchSpecMarkdownFromUrl } from "@/lib/spec-storage"

interface SpecDownloadRouteContext {
  params: Promise<{ projectId: string; specId: string }>
}

export async function GET(
  _request: Request,
  context: SpecDownloadRouteContext,
) {
  const authResult = await requireUserId()
  if (authResult.error) {
    return authResult.error
  }

  const identity = await getClerkIdentity()
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId, specId } = await context.params

  const project = await findProjectById(projectId)
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const accessible = await getAccessibleProject(projectId, identity)
  if (!accessible) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const projectSpec = await findProjectSpec(projectId, specId)
  if (!projectSpec) {
    return NextResponse.json({ error: "Spec not found" }, { status: 404 })
  }

  try {
    const markdown = await fetchSpecMarkdownFromUrl(projectSpec.filePath)
    const filename = getSpecFilename(specId)

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    console.error("[spec download GET] failed to load blob", error)
    return NextResponse.json(
      { error: "Failed to load spec file" },
      { status: 502 },
    )
  }
}
