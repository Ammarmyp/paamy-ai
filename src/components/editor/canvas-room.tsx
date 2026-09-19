"use client"

import type { ReactNode } from "react"
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense"
import { ErrorBoundary } from "react-error-boundary"

interface CanvasRoomProps {
  roomId: string
  children: ReactNode
}

export function CanvasRoom({ roomId, children }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          isThinking: false,
        }}
      >
        <ErrorBoundary fallback={<CanvasConnectionError />}>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            {children}
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

function CanvasLoading() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-base">
      <p className="text-sm text-copy-muted">Loading canvas…</p>
    </div>
  )
}

function CanvasConnectionError() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-base px-6 text-center">
      <p className="text-sm text-copy-muted">
        Unable to connect to the canvas. Please refresh and try again.
      </p>
    </div>
  )
}
