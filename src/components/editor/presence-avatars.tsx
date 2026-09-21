"use client"

import { useState } from "react"
import { UserButton, useAuth } from "@clerk/nextjs"
import { shallow, useOthersMapped } from "@liveblocks/react/suspense"

import { cn } from "@/lib/utils"

const MAX_VISIBLE_AVATARS = 5
const AVATAR_SIZE_CLASS = "h-7 w-7"

interface CollaboratorInfo {
  id: string
  name: string
  avatar: string
  color: string
}

export function PresenceAvatars() {
  const { userId } = useAuth()
  const others = useOthersMapped(
    (other) => ({
      id: other.id,
      name: other.info.name,
      avatar: other.info.avatar,
      color: other.info.color,
    }),
    shallow,
  )

  const collaborators: CollaboratorInfo[] = []
  const seenIds = new Set<string>()

  for (const [, info] of others) {
    if (!info.id || info.id === userId) {
      continue
    }
    if (seenIds.has(info.id)) {
      continue
    }
    seenIds.add(info.id)
    collaborators.push(info)
  }

  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS)
  const overflowCount = collaborators.length - visible.length
  const hasCollaborators = collaborators.length > 0

  return (
    <div className="pointer-events-none absolute top-4 right-4 z-10">
      <div
        className="flex items-center gap-2 rounded-full border border-surface-border bg-elevated/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
        aria-label="Canvas participants"
      >
        {hasCollaborators ? (
          <ul className="flex items-center">
            {visible.map((collaborator, index) => (
              <li
                key={collaborator.id}
                className={cn(index === 0 ? null : "-ml-2")}
                style={{ zIndex: index }}
              >
                <CollaboratorAvatar collaborator={collaborator} />
              </li>
            ))}
            {overflowCount > 0 ? (
              <li className="-ml-2" style={{ zIndex: visible.length }}>
                <OverflowChip count={overflowCount} />
              </li>
            ) : null}
          </ul>
        ) : null}

        {hasCollaborators ? (
          <div
            className="h-5 w-px shrink-0 bg-surface-border"
            aria-hidden
          />
        ) : null}

        <div className="pointer-events-auto flex h-7 w-7 items-center justify-center">
          <UserButton
            appearance={{
              elements: {
                rootBox: "flex h-7 w-7 items-center justify-center",
                avatarBox: AVATAR_SIZE_CLASS,
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

function CollaboratorAvatar({
  collaborator,
}: {
  collaborator: CollaboratorInfo
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(collaborator.avatar) && !imageFailed
  const initials = getInitials(collaborator.name)

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-base",
        AVATAR_SIZE_CLASS,
      )}
      title={collaborator.name}
      aria-label={collaborator.name}
    >
      {showImage ? (
        <img
          src={collaborator.avatar}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-[10px] font-medium text-copy-primary"
          style={{ backgroundColor: collaborator.color }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}

function OverflowChip({ count }: { count: number }) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-subtle text-[10px] font-medium text-copy-secondary ring-2 ring-base",
        AVATAR_SIZE_CLASS,
      )}
      aria-label={`${count} more collaborators`}
    >
      +{count}
    </div>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return "?"
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase()
  }
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase()
}
