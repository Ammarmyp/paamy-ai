"use client"

import { CanvasRoom } from "@/components/editor/canvas-room"
import { CollaborativeCanvas } from "@/components/editor/collaborative-canvas"
import { AiSidebar } from "@/components/editor/ai-sidebar"
import { useAiSidebarUi } from "@/components/editor/ai-sidebar-ui"

interface EditorWorkspaceProps {
  roomId: string
  projectName: string
}

export function EditorWorkspace({ roomId }: EditorWorkspaceProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-base">
      <CanvasRoom key={roomId} roomId={roomId}>
        <CollaborativeCanvas projectId={roomId} />
        <RoomAiSidebar roomId={roomId} />
      </CanvasRoom>
    </div>
  )
}

function RoomAiSidebar({ roomId }: { roomId: string }) {
  const { isOpen, close } = useAiSidebarUi()

  return (
    <AiSidebar
      isOpen={isOpen}
      onClose={close}
      enableSharedStatus
      roomId={roomId}
    />
  )
}
