"use client"

import { EditorDialog } from "@/components/editor/editor-dialog"
import { Button } from "@/components/ui/button"

interface DeleteProjectDialogProps {
  open: boolean
  projectName: string
  isLoading: boolean
  error?: string | null
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteProjectDialog({
  open,
  projectName,
  isLoading,
  error,
  onOpenChange,
  onCancel,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Project"
      description={`Are you sure you want to delete “${projectName}”? This cannot be undone.`}
      error={error}
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
          <Button
            type="button"
            variant="destructive"
            disabled={isLoading}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </>
      }
    />
  )
}
