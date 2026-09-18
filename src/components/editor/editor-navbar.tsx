"use client"

import { UserButton } from "@clerk/nextjs"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  center?: React.ReactNode
  className?: string
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  center,
  className,
}: EditorNavbarProps) {
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

      <div className="flex flex-1 items-center justify-center">{center}</div>

      <div className="flex flex-1 items-center justify-end">
        <UserButton />
      </div>
    </header>
  )
}
