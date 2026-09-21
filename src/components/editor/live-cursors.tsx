"use client"

import { useAuth } from "@clerk/nextjs"
import { shallow, useOther, useOthersConnectionIds } from "@liveblocks/react/suspense"
import { useReactFlow } from "@xyflow/react"

export function LiveCursors() {
  const ids = useOthersConnectionIds()

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {ids.map((connectionId) => (
        <ParticipantCursor key={connectionId} connectionId={connectionId} />
      ))}
    </div>
  )
}

function ParticipantCursor({ connectionId }: { connectionId: number }) {
  const { userId } = useAuth()
  const { flowToScreenPosition } = useReactFlow()
  const other = useOther(
    connectionId,
    (user) => ({
      id: user.id,
      cursor: user.presence.cursor,
      name: user.info.name,
      color: user.info.color,
    }),
    shallow,
  )

  if (!other.cursor || other.id === userId) {
    return null
  }

  const { x, y } = flowToScreenPosition(other.cursor)
  const name = other.name.trim() || "Anonymous"

  return (
    <div
      className="absolute top-0 left-0 will-change-transform"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <CursorPointer color={other.color} />
      <div
        className="absolute top-4 left-3 max-w-40 truncate rounded-md px-1.5 py-0.5 text-[11px] leading-tight font-medium"
        style={{ backgroundColor: other.color, color: "var(--bg-base)" }}
      >
        {name}
      </div>
    </div>
  )
}

function CursorPointer({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      aria-hidden
      className="drop-shadow-sm"
    >
      <path
        d="M1.2 1.2 1.1 16.4 5.2 12.6 7.8 18.8 10.6 17.6 8 11.4 13.6 11.4 1.2 1.2Z"
        fill={color}
        stroke="var(--bg-base)"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  )
}
