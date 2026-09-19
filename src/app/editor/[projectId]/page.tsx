import { EditorWorkspace } from "@/components/editor/editor-workspace"

interface EditorWorkspacePageProps {
  params: Promise<{ projectId: string }>
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { projectId } = await params
  return <EditorWorkspace projectId={projectId} />
}
