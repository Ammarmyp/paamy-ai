"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Project } from "@/lib/mock-projects"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: Project[]
  sharedProjects: Project[]
  onCreateProject: () => void
  onRenameProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  className?: string
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  className,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close projects sidebar"
          className="fixed inset-x-0 top-12 bottom-0 z-30 bg-base/70 md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        aria-hidden={!isOpen}
        inert={!isOpen}
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

        <Tabs
          defaultValue="my-projects"
          className="flex min-h-0 flex-1 flex-col gap-0 px-3 pt-3"
        >
          <TabsList className="w-full">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="mt-3 min-h-0 flex-1">
            <ScrollArea className="h-full">
              {ownedProjects.length > 0 ? (
                <ProjectList
                  projects={ownedProjects}
                  onRenameProject={onRenameProject}
                  onDeleteProject={onDeleteProject}
                />
              ) : (
                <EmptyTabPlaceholder label="No projects yet" />
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="shared" className="mt-3 min-h-0 flex-1">
            <ScrollArea className="h-full">
              {sharedProjects.length > 0 ? (
                <ProjectList
                  projects={sharedProjects}
                  onRenameProject={onRenameProject}
                  onDeleteProject={onDeleteProject}
                />
              ) : (
                <EmptyTabPlaceholder label="No shared projects" />
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="border-t border-surface-border p-3">
          <Button type="button" className="w-full" onClick={onCreateProject}>
            <Plus className="h-4 w-4" data-icon="inline-start" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

interface ProjectListProps {
  projects: Project[]
  onRenameProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

function ProjectList({
  projects,
  onRenameProject,
  onDeleteProject,
}: ProjectListProps) {
  return (
    <ul className="flex flex-col gap-1 pb-3">
      {projects.map((project) => (
        <li key={project.id}>
          <div className="flex items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-subtle">
            <span className="min-w-0 flex-1 truncate text-sm text-copy-primary">
              {project.name}
            </span>
            {project.owned ? (
              <div className="flex shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Rename ${project.name}`}
                  onClick={() => onRenameProject(project)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${project.name}`}
                  onClick={() => onDeleteProject(project)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyTabPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <p className="text-sm text-copy-muted">{label}</p>
    </div>
  )
}
