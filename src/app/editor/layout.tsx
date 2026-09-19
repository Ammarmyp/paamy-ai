import { redirect } from "next/navigation"

import { EditorShell } from "@/components/editor/editor-shell"
import { getClerkIdentity } from "@/lib/project-access"
import { loadEditorProjectLists } from "@/lib/projects"

interface EditorLayoutProps {
  children: React.ReactNode
}

export default async function EditorLayout({ children }: EditorLayoutProps) {
  const identity = await getClerkIdentity()
  if (!identity) {
    redirect("/sign-in")
  }

  const { ownedProjects, sharedProjects } = await loadEditorProjectLists({
    userId: identity.userId,
    email: identity.email,
  })

  return (
    <EditorShell
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    >
      {children}
    </EditorShell>
  )
}
