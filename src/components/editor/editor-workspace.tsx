interface EditorWorkspaceProps {
  roomId: string
  projectName: string
}

export function EditorWorkspace({ roomId, projectName }: EditorWorkspaceProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-base">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-copy-muted">
          Canvas for{" "}
          <span className="text-copy-secondary">{projectName}</span> will live
          here.
        </p>
        <p className="mt-2 font-mono text-xs text-copy-faint">{roomId}</p>
      </div>
    </div>
  )
}
