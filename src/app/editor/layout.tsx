import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { EditorShell } from "@/components/editor/editor-shell"
import { loadEditorProjectLists } from "@/lib/projects"

interface EditorLayoutProps {
  children: React.ReactNode
}

export default async function EditorLayout({ children }: EditorLayoutProps) {
  const { userId, isAuthenticated } = await auth()
  if (!isAuthenticated || !userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null

  const { ownedProjects, sharedProjects } = await loadEditorProjectLists({
    userId,
    email,
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
