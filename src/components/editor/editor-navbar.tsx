"use client"

import { UserButton } from "@clerk/nextjs"
import {
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Share2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"
import { cn } from "@/lib/utils"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  projectName?: string | null
  isAiSidebarOpen?: boolean
  onToggleAiSidebar?: () => void
  onShare?: () => void
  onOpenStarterTemplates?: () => void
  saveStatus?: CanvasSaveStatus
  onSave?: () => void
  showUserButton?: boolean
  className?: string
}

function saveStatusLabel(status: CanvasSaveStatus): string {
  switch (status) {
    case "saving":
      return "Saving…"
    case "saved":
      return "Saved"
    case "error":
      return "Save failed"
    default:
      return "Save"
  }
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
  onShare,
  onOpenStarterTemplates,
  saveStatus = "idle",
  onSave,
  showUserButton = true,
  className,
}: EditorNavbarProps) {
  const showWorkspaceActions = Boolean(projectName)

  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center border-b border-surface-border bg-surface px-3",
        className
      )}
    >
      <div className="flex flex-1 items-center justify-start">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"}
          onClick={onToggleSidebar}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center">
        {projectName ? (
          <h1 className="truncate text-sm font-medium text-copy-primary">
            {projectName}
          </h1>
        ) : null}
      </div>

      <div className="flex flex-1 items-center justify-end gap-1">
        {showWorkspaceActions ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={saveStatusLabel(saveStatus)}
              disabled={saveStatus === "saving"}
              onClick={onSave}
              className={cn(
                "gap-1.5 text-copy-muted",
                saveStatus === "saved" && "text-success",
                saveStatus === "error" && "text-error",
                saveStatus === "saving" && "text-copy-secondary",
              )}
            >
              <Save className="h-4 w-4" />
              <span className="text-xs">{saveStatusLabel(saveStatus)}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Import starter template"
              onClick={onOpenStarterTemplates}
            >
              <LayoutTemplate className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Share project"
              onClick={onShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={
                isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"
              }
              onClick={onToggleAiSidebar}
            >
              {isAiSidebarOpen ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
            </Button>
          </>
        ) : null}
        {showUserButton ? <UserButton /> : null}
      </div>
    </header>
  )
}
