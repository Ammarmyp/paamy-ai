interface EditorWorkspaceProps {
  projectId: string
}

export function EditorWorkspace({ projectId }: EditorWorkspaceProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-medium tracking-tight text-copy-primary">
        Workspace
      </h1>
      <p className="mt-2 max-w-md font-mono text-sm text-copy-muted">{projectId}</p>
    </div>
  )
}
