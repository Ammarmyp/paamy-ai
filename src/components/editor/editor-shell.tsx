"use client"

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"

import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectListItem } from "@/lib/project-types"

interface EditorShellProps {
  ownedProjects: ProjectListItem[]
  sharedProjects: ProjectListItem[]
  children: ReactNode
}

const OpenCreateProjectContext = createContext<(() => void) | null>(null)

export function useOpenCreateProject(): () => void {
  const openCreate = useContext(OpenCreateProjectContext)
  if (!openCreate) {
    throw new Error("useOpenCreateProject must be used within EditorShell")
  }
  return openCreate
}

export function EditorShell({
  ownedProjects,
  sharedProjects,
  children,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const {
    dialog,
    selectedProject,
    name,
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
  } = useProjectActions()

  return (
    <OpenCreateProjectContext.Provider value={openCreate}>
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
        <main className="relative flex flex-1 flex-col">{children}</main>
        <CreateProjectDialog
          open={dialog === "create"}
          name={name}
          roomId={roomId}
          isLoading={isLoading}
          error={error}
          onNameChange={setName}
          onOpenChange={handleDialogOpenChange}
          onCancel={closeDialog}
          onSubmit={() => {
            void createProject()
          }}
        />
        <RenameProjectDialog
          open={dialog === "rename"}
          currentName={selectedProject?.name ?? ""}
          name={name}
          isLoading={isLoading}
          error={error}
          onNameChange={setName}
          onOpenChange={handleDialogOpenChange}
          onCancel={closeDialog}
          onSubmit={() => {
            void renameProject()
          }}
        />
        <DeleteProjectDialog
          open={dialog === "delete"}
          projectName={selectedProject?.name ?? ""}
          isLoading={isLoading}
          error={error}
          onOpenChange={handleDialogOpenChange}
          onCancel={closeDialog}
          onConfirm={() => {
            void deleteProject()
          }}
        />
      </div>
    </OpenCreateProjectContext.Provider>
  )
}
