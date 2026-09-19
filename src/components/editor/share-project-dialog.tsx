"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Check, Copy, Trash2, UserRound } from "lucide-react"

import { EditorDialog } from "@/components/editor/editor-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface CollaboratorItem {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
}

interface ShareProjectDialogProps {
  open: boolean
  projectId: string
  projectName: string
  isOwner: boolean
  onOpenChange: (open: boolean) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (isRecord(data) && typeof data.error === "string" && data.error.length > 0) {
      return data.error
    }
  } catch {
    // Fall through.
  }
  return "Something went wrong. Please try again."
}

export function ShareProjectDialog({
  open,
  projectId,
  projectName,
  isOwner,
  onOpenChange,
}: ShareProjectDialogProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorItem[]>([])
  const [canManage, setCanManage] = useState(isOwner)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [projectLink, setProjectLink] = useState(`/editor/${projectId}`)

  useEffect(() => {
    setProjectLink(`${window.location.origin}/editor/${projectId}`)
  }, [projectId])

  const loadCollaborators = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`)
      if (!response.ok) {
        setError(await readErrorMessage(response))
        setIsLoading(false)
        return
      }

      const data: unknown = await response.json()
      if (
        !isRecord(data) ||
        typeof data.canManage !== "boolean" ||
        !Array.isArray(data.collaborators)
      ) {
        setError("Something went wrong. Please try again.")
        setIsLoading(false)
        return
      }

      const nextCollaborators: CollaboratorItem[] = []
      for (const entry of data.collaborators) {
        if (
          !isRecord(entry) ||
          typeof entry.id !== "string" ||
          typeof entry.email !== "string"
        ) {
          continue
        }
        nextCollaborators.push({
          id: entry.id,
          email: entry.email,
          name: typeof entry.name === "string" ? entry.name : null,
          imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : null,
        })
      }

      setCanManage(data.canManage)
      setCollaborators(nextCollaborators)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (!open) {
      setEmail("")
      setError(null)
      setCopied(false)
      setRemovingEmail(null)
      setIsMutating(false)
      setCanManage(isOwner)
      return
    }

    setCanManage(isOwner)
    void loadCollaborators()
  }, [isOwner, loadCollaborators, open])

  useEffect(() => {
    if (!copied) {
      return
    }
    const timeout = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || isMutating || !canManage) {
      return
    }

    setIsMutating(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })

      if (!response.ok) {
        setError(await readErrorMessage(response))
        setIsMutating(false)
        return
      }

      setEmail("")
      await loadCollaborators()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsMutating(false)
    }
  }

  async function handleRemove(collaboratorEmail: string) {
    if (!canManage || isMutating) {
      return
    }

    setRemovingEmail(collaboratorEmail)
    setIsMutating(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collaboratorEmail }),
      })

      if (!response.ok) {
        setError(await readErrorMessage(response))
        return
      }

      setCollaborators((current) =>
        current.filter((collaborator) => collaborator.email !== collaboratorEmail),
      )
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setRemovingEmail(null)
      setIsMutating(false)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(projectLink)
      setCopied(true)
    } catch {
      setError("Could not copy link. Please try again.")
    }
  }

  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Share project"
      description={`Manage access to “${projectName}”.`}
      error={error}
      className="sm:max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {canManage ? (
          <>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={projectLink}
                className="font-mono text-xs"
                aria-label="Project link"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void handleCopyLink()
                }}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" data-icon="inline-start" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" data-icon="inline-start" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <form className="flex items-center gap-2" onSubmit={handleInvite}>
              <Input
                type="email"
                value={email}
                placeholder="colleague@example.com"
                disabled={isMutating || isLoading}
                onChange={(event) => {
                  setError(null)
                  setEmail(event.target.value)
                }}
                aria-label="Collaborator email"
              />
              <Button
                type="submit"
                disabled={isMutating || isLoading || email.trim().length === 0}
              >
                Invite
              </Button>
            </form>
          </>
        ) : null}

        <div className="flex flex-col gap-2">
          <p className="text-sm text-copy-secondary">Collaborators</p>
          <ScrollArea className="max-h-56 rounded-2xl border border-surface-border">
            <ul className="flex flex-col gap-1 p-2">
              {isLoading ? (
                <li className="px-2 py-6 text-center text-sm text-copy-muted">
                  Loading…
                </li>
              ) : collaborators.length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-copy-muted">
                  No collaborators yet
                </li>
              ) : (
                collaborators.map((collaborator) => (
                  <li key={collaborator.id}>
                    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
                      <CollaboratorAvatar
                        name={collaborator.name}
                        email={collaborator.email}
                        imageUrl={collaborator.imageUrl}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-copy-primary">
                          {collaborator.name ?? collaborator.email}
                        </p>
                        {collaborator.name ? (
                          <p className="truncate text-xs text-copy-muted">
                            {collaborator.email}
                          </p>
                        ) : null}
                      </div>
                      {canManage ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${collaborator.email}`}
                          disabled={isMutating}
                          onClick={() => {
                            void handleRemove(collaborator.email)
                          }}
                        >
                          <Trash2
                            className={cn(
                              "h-4 w-4",
                              removingEmail === collaborator.email &&
                                "opacity-50",
                            )}
                          />
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </ScrollArea>
        </div>
      </div>
    </EditorDialog>
  )
}

function CollaboratorAvatar({
  name,
  email,
  imageUrl,
}: {
  name: string | null
  email: string
  imageUrl: string | null
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    )
  }

  const label = (name ?? email).trim()
  const initial = label.charAt(0).toUpperCase() || "?"

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle text-copy-muted"
      aria-hidden
    >
      {initial ? (
        <span className="text-xs font-medium">{initial}</span>
      ) : (
        <UserRound className="h-4 w-4" />
      )}
    </div>
  )
}
