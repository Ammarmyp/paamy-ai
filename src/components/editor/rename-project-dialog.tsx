"use client"

import { type FormEvent, useEffect } from "react"

import { EditorDialog } from "@/components/editor/editor-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RenameProjectDialogProps {
  open: boolean
  currentName: string
  name: string
  isLoading: boolean
  onNameChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onSubmit: () => void
}

export function RenameProjectDialog({
  open,
  currentName,
  name,
  isLoading,
  onNameChange,
  onOpenChange,
  onCancel,
  onSubmit,
}: RenameProjectDialogProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const frame = requestAnimationFrame(() => {
      document.getElementById("rename-project-name")?.focus()
    })

    return () => cancelAnimationFrame(frame)
  }, [open])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  const canSubmit = name.trim().length > 0 && !isLoading

  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Rename Project"
      description={`Current name: ${currentName}`}
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
          <Button type="submit" form="rename-project-form" disabled={!canSubmit}>
            Rename
          </Button>
        </>
      }
    >
      <form
        id="rename-project-form"
        className="flex flex-col gap-2"
        onSubmit={handleSubmit}
      >
        <label
          htmlFor="rename-project-name"
          className="text-sm text-copy-secondary"
        >
          Project name
        </label>
        <Input
          id="rename-project-name"
          value={name}
          autoFocus
          disabled={isLoading}
          onChange={(event) => onNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return
            }
            event.preventDefault()
            if (canSubmit) {
              onSubmit()
            }
          }}
        />
      </form>
    </EditorDialog>
  )
}
