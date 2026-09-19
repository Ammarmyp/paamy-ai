"use client"

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react"

import { NodeColorToolbar } from "@/components/editor/node-color-toolbar"
import { NodeShapeVisual } from "@/components/editor/node-shape-visual"
import { cn } from "@/lib/utils"
import {
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  type CanvasNode,
  type NodeColor,
} from "@/types/canvas"

const MIN_NODE_WIDTH = 48
const MIN_NODE_HEIGHT = 48
const LABEL_PLACEHOLDER = "Label"

const HANDLE_BASE_CLASS =
  "!h-2 !w-2 !min-h-0 !min-w-0 !rounded-full !border !border-base !bg-white transition-opacity duration-150"

export function CanvasNodeComponent({
  id,
  data,
  width,
  height,
  selected,
}: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow()
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const nodeWidth = width ?? 180
  const nodeHeight = height ?? 100
  const palette =
    NODE_COLORS.find((entry) => entry.fill === data.color) ?? DEFAULT_NODE_COLOR

  useEffect(() => {
    if (!isEditing) {
      return
    }

    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    textarea.focus()
    textarea.select()
  }, [isEditing])

  function startEditing(event: MouseEvent) {
    event.stopPropagation()
    event.preventDefault()
    setIsEditing(true)
  }

  function handleLabelChange(event: ChangeEvent<HTMLTextAreaElement>) {
    updateNodeData(id, { label: event.target.value })
  }

  function stopEditing() {
    setIsEditing(false)
  }

  function handleLabelKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      stopEditing()
    }
  }

  function handleColorSelect(color: NodeColor) {
    updateNodeData(id, { color: color.fill })
  }

  const handleClassName = cn(
    HANDLE_BASE_CLASS,
    selected
      ? "!opacity-100"
      : "!opacity-0 group-hover:!opacity-100",
  )

  return (
    <div
      className="group relative"
      style={{ width: nodeWidth, height: nodeHeight }}
    >
      {selected ? (
        <NodeColorToolbar
          activeFill={palette.fill}
          onSelect={handleColorSelect}
        />
      ) : null}

      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        color="var(--text-primary)"
        handleStyle={{
          width: 7,
          height: 7,
          borderRadius: 2,
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--text-primary)",
        }}
        lineStyle={{
          borderColor: "var(--text-primary)",
          borderWidth: 1,
          opacity: 0.45,
        }}
      />

      <NodeShapeVisual
        shape={data.shape}
        width={nodeWidth}
        height={nodeHeight}
        fill={palette.fill}
        textColor={palette.text}
        selected={selected}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={data.label}
            onChange={handleLabelChange}
            onBlur={stopEditing}
            onKeyDown={handleLabelKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
            rows={1}
            className={cn(
              "nodrag nopan pointer-events-auto h-full w-full resize-none bg-transparent text-center text-sm leading-snug outline-none",
            )}
            style={{ color: palette.text }}
            aria-label="Edit node label"
          />
        ) : (
          <span
            className={cn(
              "pointer-events-auto max-w-full cursor-text truncate text-center text-sm leading-snug",
              !data.label && "text-copy-muted",
            )}
            style={data.label ? { color: palette.text } : undefined}
            onDoubleClick={startEditing}
          >
            {data.label || LABEL_PLACEHOLDER}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={handleClassName}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={handleClassName}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={handleClassName}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={handleClassName}
      />
    </div>
  )
}
