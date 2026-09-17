"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function ProjectSidebar({
  isOpen,
  onClose,
  className,
}: ProjectSidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      className={cn(
        "pointer-events-none fixed top-12 left-0 z-40 flex h-[calc(100vh-3rem)] w-72 flex-col border-r border-surface-border bg-surface/95 backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen ? "pointer-events-auto translate-x-0" : "-translate-x-full",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h2 className="text-sm font-medium text-copy-primary">Projects</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close projects sidebar"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="my-projects" className="flex min-h-0 flex-1 flex-col gap-0 px-3 pt-3">
        <TabsList className="w-full">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value="my-projects" className="mt-3 min-h-0 flex-1">
          <ScrollArea className="h-full">
            <EmptyTabPlaceholder label="No projects yet" />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="shared" className="mt-3 min-h-0 flex-1">
          <ScrollArea className="h-full">
            <EmptyTabPlaceholder label="No shared projects" />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="border-t border-surface-border p-3">
        <Button type="button" className="w-full">
          <Plus className="h-4 w-4" data-icon="inline-start" />
          New Project
        </Button>
      </div>
    </aside>
  )
}

function EmptyTabPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <p className="text-sm text-copy-muted">{label}</p>
    </div>
  )
}
