import { cn } from "@/lib/utils"
import type { NodeShape } from "@/types/canvas"

interface NodeShapeVisualProps {
  shape: NodeShape
  width: number
  height: number
  fill: string
  textColor: string
  label?: string
  selected?: boolean
  className?: string
}

const REST_STROKE = "var(--border-default)"
const SELECTED_STROKE = "var(--text-primary)"

export function NodeShapeVisual({
  shape,
  width,
  height,
  fill,
  textColor,
  label = "",
  selected = false,
  className,
}: NodeShapeVisualProps) {
  const borderColor = selected ? SELECTED_STROKE : REST_STROKE

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden px-3 text-center text-sm",
          selected ? "border-2" : "border",
          shape === "rectangle" && "rounded-xl",
          (shape === "pill" || shape === "circle") && "rounded-full",
          className,
        )}
        style={{
          width,
          height,
          backgroundColor: fill,
          color: textColor,
          borderColor,
          boxShadow: selected
            ? "0 0 0 1px color-mix(in srgb, var(--text-primary) 35%, transparent)"
            : undefined,
        }}
      >
        {label ? <span className="truncate">{label}</span> : null}
      </div>
    )
  }

  return (
    <div
      className={cn("relative", className)}
      style={{
        width,
        height,
        color: textColor,
        filter: selected
          ? "drop-shadow(0 0 1px color-mix(in srgb, var(--text-primary) 55%, transparent))"
          : undefined,
      }}
    >
      <SvgShape
        shape={shape}
        fill={fill}
        stroke={borderColor}
        selected={selected}
      />
      {label ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-3 text-center text-sm">
          <span className="truncate">{label}</span>
        </span>
      ) : null}
    </div>
  )
}

function SvgShape({
  shape,
  fill,
  stroke,
  selected,
}: {
  shape: Extract<NodeShape, "diamond" | "hexagon" | "cylinder">
  fill: string
  stroke: string
  selected: boolean
}) {
  const strokeWidth = selected ? 2.5 : 1.5

  if (shape === "diamond") {
    return (
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polygon
          points="50,3 97,50 50,97 3,50"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  if (shape === "hexagon") {
    return (
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polygon
          points="25,4 75,4 98,50 75,96 25,96 2,50"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 100 120"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M8 22
           C8 12, 92 12, 92 22
           L92 98
           C92 108, 8 108, 8 98
           Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx="50"
        cy="22"
        rx="42"
        ry="12"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
