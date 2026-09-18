"use client"

import { useState } from "react"

import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const {
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
  } = useProjectDialogs()

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      />
      <main className="relative flex flex-1 flex-col">
        <EditorHome onNewProject={openCreate} />
      </main>
      <CreateProjectDialog
        open={dialog === "create"}
        name={name}
        slug={slug}
        isLoading={isLoading}
        onNameChange={setName}
        onOpenChange={handleDialogOpenChange}
        onCancel={closeDialog}
        onSubmit={createProject}
      />
      <RenameProjectDialog
        open={dialog === "rename"}
        currentName={selectedProject?.name ?? ""}
        name={name}
        slug={slug}
        isLoading={isLoading}
        onNameChange={setName}
        onOpenChange={handleDialogOpenChange}
        onCancel={closeDialog}
        onSubmit={renameProject}
      />
      <DeleteProjectDialog
        open={dialog === "delete"}
        projectName={selectedProject?.name ?? ""}
        isLoading={isLoading}
        onOpenChange={handleDialogOpenChange}
        onCancel={closeDialog}
        onConfirm={deleteProject}
      />
    </div>
  )
}
