import { redirect } from "next/navigation"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspace } from "@/components/editor/editor-workspace"
import {
  getAccessibleProject,
  getClerkIdentity,
} from "@/lib/project-access"

interface EditorWorkspacePageProps {
  params: Promise<{ roomId: string }>
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { roomId } = await params

  const identity = await getClerkIdentity()
  if (!identity) {
    redirect("/sign-in")
  }

  const project = await getAccessibleProject(roomId, identity)
  if (!project) {
    return <AccessDenied />
  }

  return (
    <EditorWorkspace
      roomId={project.id}
      projectName={project.name}
    />
  )
}
