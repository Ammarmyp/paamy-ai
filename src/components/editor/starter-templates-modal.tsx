"use client"

import { useMemo } from "react"

import { EditorDialog } from "@/components/editor/editor-dialog"
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import { NodeShapeVisual } from "@/components/editor/node-shape-visual"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DEFAULT_EDGE_COLOR, resolveNodePaint } from "@/types/canvas"
import { cn } from "@/lib/utils"

const PREVIEW_WIDTH = 280
const PREVIEW_HEIGHT = 148
const PREVIEW_PADDING = 28

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

interface TemplateBounds {
  minX: number
  minY: number
  width: number
  height: number
}

function getTemplateBounds(template: CanvasTemplate): TemplateBounds {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const node of template.nodes) {
    const width = node.width ?? 120
    const height = node.height ?? 80
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + width)
    maxY = Math.max(maxY, node.position.y + height)
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return { minX: 0, minY: 0, width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }
  }

  return {
    minX,
    minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  }
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const layout = useMemo(() => {
    const bounds = getTemplateBounds(template)
    const scale = Math.min(
      PREVIEW_WIDTH / (bounds.width + PREVIEW_PADDING * 2),
      PREVIEW_HEIGHT / (bounds.height + PREVIEW_PADDING * 2),
    )
    const offsetX =
      (PREVIEW_WIDTH - (bounds.width + PREVIEW_PADDING * 2) * scale) / 2 +
      PREVIEW_PADDING * scale
    const offsetY =
      (PREVIEW_HEIGHT - (bounds.height + PREVIEW_PADDING * 2) * scale) / 2 +
      PREVIEW_PADDING * scale

    const nodeCenters = new Map<string, { x: number; y: number }>()
    for (const node of template.nodes) {
      const width = node.width ?? 120
      const height = node.height ?? 80
      nodeCenters.set(node.id, {
        x: offsetX + (node.position.x - bounds.minX + width / 2) * scale,
        y: offsetY + (node.position.y - bounds.minY + height / 2) * scale,
      })
    }

    return { bounds, scale, offsetX, offsetY, nodeCenters }
  }, [template])

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-surface-border bg-base"
      style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
      aria-hidden
    >
      <svg
        className="absolute inset-0"
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
      >
        {template.edges.map((edge) => {
          const source = layout.nodeCenters.get(edge.source)
          const target = layout.nodeCenters.get(edge.target)
          if (!source || !target) {
            return null
          }
          return (
            <line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={DEFAULT_EDGE_COLOR}
              strokeOpacity={0.45}
              strokeWidth={1}
            />
          )
        })}
      </svg>

      {template.nodes.map((node) => {
        const width = (node.width ?? 120) * layout.scale
        const height = (node.height ?? 80) * layout.scale
        const left =
          layout.offsetX + (node.position.x - layout.bounds.minX) * layout.scale
        const top =
          layout.offsetY + (node.position.y - layout.bounds.minY) * layout.scale
        const palette = resolveNodePaint(node.data.color)

        return (
          <div
            key={node.id}
            className="absolute"
            style={{ left, top, width, height }}
          >
            <NodeShapeVisual
              shape={node.data.shape}
              width={width}
              height={height}
              fill={palette.fill}
              textColor={palette.text}
              className="pointer-events-none [&_span]:text-[7px] [&_span]:leading-none"
            />
          </div>
        )
      })}
    </div>
  )
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Starter templates"
      description="Replace the current canvas with a pre-built system design."
      className="sm:max-w-3xl"
    >
      <ScrollArea className="max-h-[min(28rem,70vh)] pr-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CANVAS_TEMPLATES.map((template) => (
            <article
              key={template.id}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border border-surface-border bg-subtle/40 p-3",
              )}
            >
              <TemplatePreview template={template} />
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-copy-primary">
                  {template.name}
                </h3>
                <p className="text-xs text-copy-muted">{template.description}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-auto w-full"
                onClick={() => {
                  onImport(template)
                  onOpenChange(false)
                }}
              >
                Import
              </Button>
            </article>
          ))}
        </div>
      </ScrollArea>
    </EditorDialog>
  )
}
