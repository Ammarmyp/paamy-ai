import { CanvasRoom } from "@/components/editor/canvas-room"
import { CollaborativeCanvas } from "@/components/editor/collaborative-canvas"

interface EditorWorkspaceProps {
  roomId: string
  projectName: string
}

export function EditorWorkspace({ roomId }: EditorWorkspaceProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-base">
      <CanvasRoom key={roomId} roomId={roomId}>
        <CollaborativeCanvas projectId={roomId} />
      </CanvasRoom>
    </div>
  )
}
