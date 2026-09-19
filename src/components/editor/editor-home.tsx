"use client"

import { Plus } from "lucide-react"

import { useOpenCreateProject } from "@/components/editor/editor-shell"
import { Button } from "@/components/ui/button"

export function EditorHome() {
  const onNewProject = useOpenCreateProject()

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-medium tracking-tight text-copy-primary">
        Create a project or open an existing one
      </h1>
      <p className="mt-2 max-w-md text-sm text-copy-muted">
        Start a new architecture workspace, or choose a project from the sidebar.
      </p>
      <Button type="button" className="mt-6" onClick={onNewProject}>
        <Plus className="h-4 w-4" data-icon="inline-start" />
        New Project
      </Button>
    </div>
  )
}
