"use client"

import { usePathname, useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import type { ProjectListItem } from "@/lib/project-types"
import { slugify } from "@/lib/slug"

export type ProjectDialog = "create" | "rename" | "delete"

const EMPTY_SLUG_PREFIX = "project"

function createShortSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

function getActiveProjectId(pathname: string): string | null {
  const match = pathname.match(/^\/editor\/([^/]+)$/)
  return match?.[1] ?? null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function readMutationError(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (isRecord(data) && typeof data.error === "string" && data.error.length > 0) {
      return data.error
    }
  } catch {
    // Fall through to the generic message when the body is not JSON.
  }

  return "Something went wrong. Please try again."
}

export function useProjectActions() {
  const router = useRouter()
  const pathname = usePathname()
  const activeProjectId = getActiveProjectId(pathname)

  const [dialog, setDialog] = useState<ProjectDialog | null>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectListItem | null>(
    null,
  )
  const [name, setNameState] = useState("")
  const [createSuffix, setCreateSuffix] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = useMemo(() => slugify(name), [name])
  const roomId = useMemo(() => {
    if (!createSuffix) {
      return ""
    }
    const prefix = slug || EMPTY_SLUG_PREFIX
    return `${prefix}-${createSuffix}`
  }, [createSuffix, slug])

  const setName = useCallback((value: string) => {
    setError(null)
    setNameState(value)
  }, [])

  const closeDialog = useCallback(() => {
    setDialog(null)
    setSelectedProject(null)
    setNameState("")
    setCreateSuffix("")
    setIsLoading(false)
    setError(null)
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
    setNameState("")
    setCreateSuffix(createShortSuffix())
    setError(null)
    setDialog("create")
  }, [])

  const openRename = useCallback((project: ProjectListItem) => {
    setSelectedProject(project)
    setNameState(project.name)
    setError(null)
    setDialog("rename")
  }, [])

  const openDelete = useCallback((project: ProjectListItem) => {
    setSelectedProject(project)
    setError(null)
    setDialog("delete")
  }, [])

  const createProject = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed || !roomId || isLoading) {
      return
    }

    setError(null)
    setIsLoading(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, id: roomId }),
      })

      if (!response.ok) {
        setError(await readMutationError(response))
        setIsLoading(false)
        return
      }

      let data: { project?: { id?: string } }
      try {
        data = (await response.json()) as { project?: { id?: string } }
      } catch {
        setError("Something went wrong. Please try again.")
        setIsLoading(false)
        return
      }

      const projectId = data.project?.id ?? roomId
      closeDialog()
      router.push(`/editor/${projectId}`)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
      setIsLoading(false)
    }
  }, [closeDialog, isLoading, name, roomId, router])

  const renameProject = useCallback(async () => {
    const trimmed = name.trim()
    if (!selectedProject || !trimmed || isLoading) {
      return
    }

    setError(null)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })

      if (!response.ok) {
        setError(await readMutationError(response))
        setIsLoading(false)
        return
      }

      closeDialog()
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
      setIsLoading(false)
    }
  }, [closeDialog, isLoading, name, router, selectedProject])

  const deleteProject = useCallback(async () => {
    if (!selectedProject || isLoading) {
      return
    }

    const deletedId = selectedProject.id
    setError(null)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${deletedId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        setError(await readMutationError(response))
        setIsLoading(false)
        return
      }

      closeDialog()
      if (activeProjectId === deletedId) {
        router.push("/editor")
      }
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
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
    error,
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
