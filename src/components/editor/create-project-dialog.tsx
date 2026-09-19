"use client"

import type { FormEvent } from "react"

import { EditorDialog } from "@/components/editor/editor-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CreateProjectDialogProps {
  open: boolean
  name: string
  roomId: string
  isLoading: boolean
  onNameChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onSubmit: () => void
}

export function CreateProjectDialog({
  open,
  name,
  roomId,
  isLoading,
  onNameChange,
  onOpenChange,
  onCancel,
  onSubmit,
}: CreateProjectDialogProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  const canSubmit = name.trim().length > 0 && roomId.length > 0 && !isLoading

  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Project"
      description="Give your project a name. The room ID updates as you type."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" form="create-project-form" disabled={!canSubmit}>
            Create
          </Button>
        </>
      }
    >
      <form
        id="create-project-form"
        className="flex flex-col gap-2"
        onSubmit={handleSubmit}
      >
        <label
          htmlFor="create-project-name"
          className="text-sm text-copy-secondary"
        >
          Project name
        </label>
        <Input
          id="create-project-name"
          value={name}
          placeholder="Payments Platform"
          disabled={isLoading}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <p className="text-xs text-copy-muted">
          Room ID preview:{" "}
          <span className="font-mono text-copy-primary">{roomId || "—"}</span>
        </p>
      </form>
    </EditorDialog>
  )
}
