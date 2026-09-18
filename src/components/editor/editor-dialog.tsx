"use client"

import type { ReactNode } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface EditorDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
  showCloseButton?: boolean
}

/**
 * Reusable dialog shell for editor surfaces.
 * Supports title, description, body content, and footer actions.
 * Does not define feature-specific dialogs — compose those later with this pattern.
 */
export function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  showCloseButton = true,
}: EditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          "max-w-md gap-4 rounded-3xl border border-surface-border bg-elevated p-6 text-copy-primary shadow-none ring-0 sm:max-w-md [&_input]:text-copy-primary [&_input]:caret-copy-primary [&_input]:placeholder:text-copy-muted",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-copy-primary">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-copy-muted">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {children}

        {footer ? (
          <DialogFooter className="rounded-b-3xl border-t border-surface-border bg-subtle/50">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
