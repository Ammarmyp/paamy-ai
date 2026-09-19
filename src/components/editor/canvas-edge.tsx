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
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react"

import { cn } from "@/lib/utils"
import { DEFAULT_EDGE_COLOR, type CanvasEdge } from "@/types/canvas"

const EDGE_STROKE_WIDTH = 1.25
const EDGE_INTERACTION_WIDTH = 20
const LABEL_HINT = "Add label"
const LABEL_INPUT_MIN_CHARS = 6

export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow()
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(data?.label ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const savedLabel = data?.label?.trim() ?? ""
  const isActive = Boolean(selected || isHovered || isEditing)

  useEffect(() => {
    if (!isEditing) {
      return
    }

    const input = inputRef.current
    if (!input) {
      return
    }

    input.focus()
    input.select()
  }, [isEditing])

  function startEditing(event: MouseEvent) {
    event.stopPropagation()
    event.preventDefault()
    setDraftLabel(data?.label ?? "")
    setIsEditing(true)
  }

  function saveLabel() {
    const nextLabel = draftLabel.trim()
    updateEdgeData(id, { label: nextLabel })
    setIsEditing(false)
  }

  function handleLabelChange(event: ChangeEvent<HTMLInputElement>) {
    setDraftLabel(event.target.value)
  }

  function handleLabelKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      saveLabel()
    }
  }

  const strokeOpacity = isActive ? 1 : 0.55
  const inputSize = Math.max(
    LABEL_INPUT_MIN_CHARS,
    draftLabel.length || LABEL_HINT.length,
  )

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={0}
        style={{
          ...style,
          stroke: DEFAULT_EDGE_COLOR,
          strokeWidth: EDGE_STROKE_WIDTH,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          opacity: strokeOpacity,
        }}
      />
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={EDGE_INTERACTION_WIDTH}
        className="react-flow__edge-interaction"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={startEditing}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={draftLabel}
              size={inputSize}
              onChange={handleLabelChange}
              onBlur={saveLabel}
              onKeyDown={handleLabelKeyDown}
              onMouseDown={(event) => event.stopPropagation()}
              placeholder={LABEL_HINT}
              className={cn(
                "rounded-full border border-surface-border bg-elevated px-2.5 py-0.5",
                "text-center text-xs text-copy-primary outline-none",
                "placeholder:text-copy-faint",
              )}
              aria-label="Edit edge label"
            />
          ) : savedLabel ? (
            <button
              type="button"
              className={cn(
                "rounded-full border border-surface-border bg-elevated px-2.5 py-0.5",
                "text-xs text-copy-secondary transition-opacity",
                isActive ? "opacity-100" : "opacity-80",
              )}
              onDoubleClick={startEditing}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {savedLabel}
            </button>
          ) : isActive ? (
            <button
              type="button"
              className="rounded-full px-2 py-0.5 text-xs text-copy-faint"
              onDoubleClick={startEditing}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {LABEL_HINT}
            </button>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
