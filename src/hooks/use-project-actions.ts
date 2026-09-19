"use client"

import { usePathname, useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import type { ProjectListItem } from "@/lib/project-types"
import { slugify } from "@/lib/slug"

export type ProjectDialog = "create" | "rename" | "delete"

function createShortSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

function getActiveProjectId(pathname: string): string | null {
  const match = pathname.match(/^\/editor\/([^/]+)$/)
  return match?.[1] ?? null
}

export function useProjectActions() {
  const router = useRouter()
  const pathname = usePathname()
  const activeProjectId = getActiveProjectId(pathname)

  const [dialog, setDialog] = useState<ProjectDialog | null>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectListItem | null>(
    null,
  )
  const [name, setName] = useState("")
  const [createSuffix, setCreateSuffix] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const slug = useMemo(() => slugify(name), [name])
  const roomId = useMemo(() => {
    if (!slug || !createSuffix) {
      return ""
    }
    return `${slug}-${createSuffix}`
  }, [createSuffix, slug])

  const closeDialog = useCallback(() => {
    setDialog(null)
    setSelectedProject(null)
    setName("")
    setCreateSuffix("")
    setIsLoading(false)
  }, [])

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDialog()
      }
    },
    [closeDialog],
  )

  const openCreate = useCallback(() => {
    setSelectedProject(null)
    setName("")
    setCreateSuffix(createShortSuffix())
    setDialog("create")
  }, [])

  const openRename = useCallback((project: ProjectListItem) => {
    setSelectedProject(project)
    setName(project.name)
    setDialog("rename")
  }, [])

  const openDelete = useCallback((project: ProjectListItem) => {
    setSelectedProject(project)
    setDialog("delete")
  }, [])

  const createProject = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed || !roomId || isLoading) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, id: roomId }),
      })

      if (!response.ok) {
        setIsLoading(false)
        return
      }

      const data = (await response.json()) as { project?: { id?: string } }
      const projectId = data.project?.id ?? roomId
      closeDialog()
      router.push(`/editor/${projectId}`)
      router.refresh()
    } catch {
      setIsLoading(false)
    }
  }, [closeDialog, isLoading, name, roomId, router])

  const renameProject = useCallback(async () => {
    const trimmed = name.trim()
    if (!selectedProject || !trimmed || isLoading) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })

      if (!response.ok) {
        setIsLoading(false)
        return
      }

      closeDialog()
      router.refresh()
    } catch {
      setIsLoading(false)
    }
  }, [closeDialog, isLoading, name, router, selectedProject])

  const deleteProject = useCallback(async () => {
    if (!selectedProject || isLoading) {
      return
    }

    const deletedId = selectedProject.id
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${deletedId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        setIsLoading(false)
        return
      }

      closeDialog()
      if (activeProjectId === deletedId) {
        router.push("/editor")
      }
      router.refresh()
    } catch {
      setIsLoading(false)
    }
  }, [activeProjectId, closeDialog, isLoading, router, selectedProject])

  return {
    dialog,
    selectedProject,
    name,
    slug,
    roomId,
    isLoading,
    setName,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleDialogOpenChange,
    createProject,
    renameProject,
    deleteProject,
  }
}
