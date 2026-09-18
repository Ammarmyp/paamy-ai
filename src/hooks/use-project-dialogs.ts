"use client"

import { useCallback, useMemo, useState } from "react"

import { MOCK_PROJECTS, type Project } from "@/lib/mock-projects"
import { slugify } from "@/lib/slug"

export type ProjectDialog = "create" | "rename" | "delete"

export function useProjectDialogs() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [dialog, setDialog] = useState<ProjectDialog | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const slug = useMemo(() => slugify(name), [name])

  const ownedProjects = useMemo(
    () => projects.filter((project) => project.owned),
    [projects]
  )
  const sharedProjects = useMemo(
    () => projects.filter((project) => !project.owned),
    [projects]
  )

  const closeDialog = useCallback(() => {
    setDialog(null)
    setSelectedProject(null)
    setName("")
    setIsLoading(false)
  }, [])

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDialog()
      }
    },
    [closeDialog]
  )

  const openCreate = useCallback(() => {
    setSelectedProject(null)
    setName("")
    setDialog("create")
  }, [])

  const openRename = useCallback((project: Project) => {
    setSelectedProject(project)
    setName(project.name)
    setDialog("rename")
  }, [])

  const openDelete = useCallback((project: Project) => {
    setSelectedProject(project)
    setDialog("delete")
  }, [])

  const createProject = useCallback(() => {
    const trimmed = name.trim()
    const nextSlug = slugify(trimmed)
    if (!trimmed || !nextSlug) {
      return
    }

    setIsLoading(true)
    setProjects((current) => [
      {
        id: crypto.randomUUID(),
        name: trimmed,
        slug: nextSlug,
        owned: true,
      },
      ...current,
    ])
    closeDialog()
  }, [closeDialog, name])

  const renameProject = useCallback(() => {
    const trimmed = name.trim()
    const nextSlug = slugify(trimmed)
    if (!selectedProject || !trimmed || !nextSlug) {
      return
    }

    setIsLoading(true)
    setProjects((current) =>
      current.map((project) =>
        project.id === selectedProject.id
          ? { ...project, name: trimmed, slug: nextSlug }
          : project
      )
    )
    closeDialog()
  }, [closeDialog, name, selectedProject])

  const deleteProject = useCallback(() => {
    if (!selectedProject) {
      return
    }

    setIsLoading(true)
    setProjects((current) =>
      current.filter((project) => project.id !== selectedProject.id)
    )
    closeDialog()
  }, [closeDialog, selectedProject])

  return {
    ownedProjects,
    sharedProjects,
    dialog,
    selectedProject,
    name,
    slug,
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
