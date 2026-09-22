"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

import { AiSidebar } from "@/components/editor/ai-sidebar"
import { CanvasSaveUiProvider, useCanvasSaveUi } from "@/components/editor/canvas-save-ui"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { ShareProjectDialog } from "@/components/editor/share-project-dialog"
import {
  StarterTemplatesUiProvider,
  useStarterTemplatesUi,
} from "@/components/editor/starter-templates-ui"
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

function getActiveRoomId(pathname: string): string | null {
  const match = pathname.match(/^\/editor\/([^/]+)$/)
  return match?.[1] ?? null
}

export function EditorShell({
  ownedProjects,
  sharedProjects,
  children,
}: EditorShellProps) {
  return (
    <StarterTemplatesUiProvider>
      <CanvasSaveUiProvider>
        <EditorShellInner
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
        >
          {children}
        </EditorShellInner>
      </CanvasSaveUiProvider>
    </StarterTemplatesUiProvider>
  )
}

function EditorShellInner({
  ownedProjects,
  sharedProjects,
  children,
}: EditorShellProps) {
  const pathname = usePathname()
  const activeRoomId = getActiveRoomId(pathname)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const starterTemplates = useStarterTemplatesUi()
  const { setOpen: setTemplatesOpen } = starterTemplates
  const canvasSave = useCanvasSaveUi()
  const { setStatus: setCanvasSaveStatus } = canvasSave
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

  const activeProject = useMemo(() => {
    if (!activeRoomId) {
      return null
    }
    return (
      ownedProjects.find((project) => project.id === activeRoomId) ??
      sharedProjects.find((project) => project.id === activeRoomId) ??
      null
    )
  }, [activeRoomId, ownedProjects, sharedProjects])

  useEffect(() => {
    setIsShareOpen(false)
    setTemplatesOpen(false)
    setCanvasSaveStatus("idle")
  }, [activeRoomId, setTemplatesOpen, setCanvasSaveStatus])

  return (
    <OpenCreateProjectContext.Provider value={openCreate}>
      <div className="relative flex min-h-full flex-1 flex-col bg-base">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          projectName={activeProject?.name ?? null}
          isAiSidebarOpen={isAiSidebarOpen}
          onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
          onShare={() => setIsShareOpen(true)}
          onOpenStarterTemplates={starterTemplates.open}
          saveStatus={activeRoomId ? canvasSave.status : "idle"}
          onSave={() => {
            void canvasSave.saveNow()
          }}
          showUserButton={!activeRoomId}
        />
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeRoomId={activeRoomId}
          onCreateProject={openCreate}
          onRenameProject={openRename}
          onDeleteProject={openDelete}
        />
        <div className="relative flex min-h-0 flex-1">
          <main className="relative flex min-w-0 flex-1 flex-col">{children}</main>
          <AiSidebar
            isOpen={isAiSidebarOpen}
            onClose={() => setIsAiSidebarOpen(false)}
          />
        </div>
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
        {activeProject ? (
          <ShareProjectDialog
            open={isShareOpen}
            projectId={activeProject.id}
            projectName={activeProject.name}
            isOwner={activeProject.owned}
            onOpenChange={setIsShareOpen}
          />
        ) : null}
      </div>
    </OpenCreateProjectContext.Provider>
  )
}
