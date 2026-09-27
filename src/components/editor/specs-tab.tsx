"use client"

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import { useFeedMessages } from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import ReactMarkdown from "react-markdown"
import { Download, FileText, Loader2 } from "lucide-react"

import { useCanvasGraphSnapshot } from "@/components/editor/canvas-graph-ui"
import { EditorDialog } from "@/components/editor/editor-dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { generateSpecTask } from "@/trigger/generate-spec"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import type { GenerateSpecRequest } from "@/types/spec-generation"
import {
  AI_CHAT_FEED_ID,
  parseAiChatFeedPayload,
  type AiChatMessage,
} from "@/types/tasks"

interface SpecListItem {
  id: string
  createdAt: string
  filename: string
}

interface SpecsTabProps {
  projectId?: string
  /** When true, Generate Spec can snapshot Liveblocks chat + canvas. */
  enableGeneration?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (
      isRecord(data) &&
      typeof data.error === "string" &&
      data.error.length > 0
    ) {
      return data.error
    }
  } catch {
    // Fall through — body may be Markdown or empty.
  }
  return "Something went wrong. Please try again."
}

function formatSpecCreatedAt(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) {
    return createdAt
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function specDownloadUrl(projectId: string, specId: string): string {
  return `/api/projects/${projectId}/specs/${specId}/download`
}

function triggerSpecDownload(
  projectId: string,
  specId: string,
  filename: string,
) {
  const link = document.createElement("a")
  link.href = specDownloadUrl(projectId, specId)
  link.download = filename
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function toSpecNodes(nodes: CanvasNode[]): GenerateSpecRequest["nodes"] {
  return nodes.map((node) => ({
    id: node.id,
    type: "canvasNode" as const,
    position: {
      x: node.position.x,
      y: node.position.y,
    },
    ...(typeof node.width === "number" ? { width: node.width } : {}),
    ...(typeof node.height === "number" ? { height: node.height } : {}),
    data: {
      label: node.data.label,
      color: node.data.color,
      shape: node.data.shape,
    },
  }))
}

function toSpecEdges(edges: CanvasEdge[]): GenerateSpecRequest["edges"] {
  return edges.map((edge) => ({
    id: edge.id,
    type: "canvasEdge" as const,
    source: edge.source,
    target: edge.target,
    ...(edge.sourceHandle != null ? { sourceHandle: edge.sourceHandle } : {}),
    ...(edge.targetHandle != null ? { targetHandle: edge.targetHandle } : {}),
    data: {
      label: edge.data?.label ?? "",
    },
  }))
}

function parseSpecList(data: unknown): SpecListItem[] | null {
  if (!isRecord(data) || !Array.isArray(data.specs)) {
    return null
  }

  const nextSpecs: SpecListItem[] = []
  for (const entry of data.specs) {
    if (
      !isRecord(entry) ||
      typeof entry.id !== "string" ||
      typeof entry.createdAt !== "string" ||
      typeof entry.filename !== "string"
    ) {
      continue
    }
    nextSpecs.push({
      id: entry.id,
      createdAt: entry.createdAt,
      filename: entry.filename,
    })
  }
  return nextSpecs
}

function parseRunId(data: unknown): string | null {
  if (!isRecord(data) || typeof data.runId !== "string") {
    return null
  }
  const runId = data.runId.trim()
  return runId.length > 0 ? runId : null
}

function parsePublicToken(data: unknown): string | null {
  if (!isRecord(data)) {
    return null
  }
  const token =
    typeof data.token === "string"
      ? data.token.trim()
      : typeof data.publicToken === "string"
        ? data.publicToken.trim()
        : ""
  return token.length > 0 ? token : null
}

function readRunMetadataLabel(metadata: unknown): string | null {
  if (!isRecord(metadata) || typeof metadata.label !== "string") {
    return null
  }
  const label = metadata.label.trim()
  return label.length > 0 ? label : null
}

export function SpecsTab({
  projectId,
  enableGeneration = false,
}: SpecsTabProps) {
  if (enableGeneration && projectId) {
    return <SpecsTabWithGeneration roomId={projectId} />
  }

  return (
    <SpecsTabPanel
      projectId={projectId}
      canGenerate={false}
      isGenerating={false}
      generateError={null}
      generateStatus={null}
      onGenerate={undefined}
    />
  )
}

function SpecsTabWithGeneration({ roomId }: { roomId: string }) {
  const { nodes, edges } = useCanvasGraphSnapshot()
  const { messages: feedMessages } = useFeedMessages(AI_CHAT_FEED_ID)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [listRefreshKey, setListRefreshKey] = useState(0)
  const completedRunRef = useRef<string | null>(null)

  const chatHistory: AiChatMessage[] = (feedMessages ?? [])
    .map((message) => parseAiChatFeedPayload(message.data))
    .filter((message): message is AiChatMessage => Boolean(message))

  const isRunActive = Boolean(runId && publicToken)
  const isGenerating = isRunActive || isSubmitting

  const finishRun = useEffectEvent(
    (completedRunId: string, errorMessage?: string) => {
      if (completedRunRef.current === completedRunId) {
        return
      }
      completedRunRef.current = completedRunId

      if (errorMessage) {
        setGenerateError(errorMessage)
      } else {
        setGenerateError(null)
        setListRefreshKey((key) => key + 1)
      }

      setRunId(null)
      setPublicToken(null)
      setIsSubmitting(false)
    },
  )

  const { run, error: realtimeError } = useRealtimeRun<typeof generateSpecTask>(
    runId ?? undefined,
    {
      accessToken: publicToken ?? undefined,
      enabled: isRunActive,
      skipColumns: ["payload"],
      onComplete: (completedRun, err) => {
        const failed =
          Boolean(err) ||
          completedRun.status === "FAILED" ||
          completedRun.status === "CRASHED" ||
          completedRun.status === "SYSTEM_FAILURE" ||
          completedRun.status === "TIMED_OUT" ||
          completedRun.status === "CANCELED" ||
          completedRun.status === "EXPIRED"

        finishRun(
          completedRun.id,
          failed
            ? err?.message ||
                completedRun.error?.message ||
                "Spec generation failed. Please try again."
            : undefined,
        )
      },
    },
  )

  useEffect(() => {
    if (!realtimeError || !runId) {
      return
    }
    finishRun(runId, realtimeError.message || "Couldn't track spec run.")
  }, [realtimeError, runId])

  async function handleGenerate() {
    if (isGenerating) {
      return
    }

    setIsSubmitting(true)
    setGenerateError(null)
    completedRunRef.current = null

    const body: GenerateSpecRequest = {
      roomId,
      chatHistory,
      nodes: toSpecNodes(nodes),
      edges: toSpecEdges(edges),
    }

    try {
      const response = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        setGenerateError(readErrorMessageFromData(data) ?? "Couldn't start spec generation.")
        setIsSubmitting(false)
        return
      }

      const nextRunId = parseRunId(data)
      if (!nextRunId) {
        setGenerateError("Spec started but run id was missing.")
        setIsSubmitting(false)
        return
      }

      const tokenResponse = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: nextRunId }),
      })
      const tokenData: unknown = await tokenResponse.json().catch(() => null)
      if (!tokenResponse.ok) {
        setGenerateError(
          readErrorMessageFromData(tokenData) ??
            "Couldn't create access token for the spec run.",
        )
        setIsSubmitting(false)
        return
      }

      const token = parsePublicToken(tokenData)
      if (!token) {
        setGenerateError("Spec token response was invalid.")
        setIsSubmitting(false)
        return
      }

      setRunId(nextRunId)
      setPublicToken(token)
      setIsSubmitting(false)
    } catch {
      setGenerateError("Couldn't reach the spec generator. Try again.")
      setIsSubmitting(false)
    }
  }

  const generateStatus =
    readRunMetadataLabel(run?.metadata) ??
    (isRunActive
      ? run
        ? `Ghost AI is ${run.status.toLowerCase().replaceAll("_", " ")}…`
        : "Ghost AI is writing the spec…"
      : isSubmitting
        ? "Starting spec generation…"
        : null)

  return (
    <SpecsTabPanel
      projectId={roomId}
      canGenerate
      isGenerating={isGenerating}
      generateError={generateError}
      generateStatus={generateStatus}
      onGenerate={() => {
        void handleGenerate()
      }}
      listRefreshKey={listRefreshKey}
    />
  )
}

function readErrorMessageFromData(data: unknown): string | null {
  if (!isRecord(data) || typeof data.error !== "string") {
    return null
  }
  const error = data.error.trim()
  return error.length > 0 ? error : null
}

function SpecsTabPanel({
  projectId,
  canGenerate,
  isGenerating,
  generateError,
  generateStatus,
  onGenerate,
  listRefreshKey = 0,
}: {
  projectId?: string
  canGenerate: boolean
  isGenerating: boolean
  generateError: string | null
  generateStatus: string | null
  onGenerate?: () => void
  listRefreshKey?: number
}) {
  const [specs, setSpecs] = useState<SpecListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedSpec, setSelectedSpec] = useState<SpecListItem | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const loadSpecs = useCallback(async (id: string, signal?: { cancelled: boolean }) => {
    setIsLoading(true)
    setListError(null)

    try {
      const response = await fetch(`/api/projects/${id}/specs`)
      if (!response.ok) {
        if (!signal?.cancelled) {
          setListError(await readErrorMessage(response))
          setSpecs([])
        }
        return
      }

      const data: unknown = await response.json()
      const nextSpecs = parseSpecList(data)
      if (!nextSpecs) {
        if (!signal?.cancelled) {
          setListError("Couldn't load specs. Please try again.")
          setSpecs([])
        }
        return
      }

      if (!signal?.cancelled) {
        setSpecs(nextSpecs)
      }
    } catch {
      if (!signal?.cancelled) {
        setListError("Couldn't load specs. Please try again.")
        setSpecs([])
      }
    } finally {
      if (!signal?.cancelled) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!projectId) {
      setSpecs([])
      setListError(null)
      setIsLoading(false)
      return
    }

    const signal = { cancelled: false }
    void loadSpecs(projectId, signal)

    return () => {
      signal.cancelled = true
    }
  }, [projectId, listRefreshKey, loadSpecs])

  useEffect(() => {
    if (!projectId || !selectedSpec) {
      setPreviewContent(null)
      setPreviewError(null)
      setIsPreviewLoading(false)
      return
    }

    let cancelled = false
    const activeProjectId = projectId
    const activeSpecId = selectedSpec.id

    async function loadPreview() {
      setIsPreviewLoading(true)
      setPreviewError(null)
      setPreviewContent(null)

      try {
        const response = await fetch(
          specDownloadUrl(activeProjectId, activeSpecId),
        )
        if (!response.ok) {
          if (!cancelled) {
            setPreviewError(await readErrorMessage(response))
          }
          return
        }

        const markdown = await response.text()
        if (!cancelled) {
          setPreviewContent(markdown)
        }
      } catch {
        if (!cancelled) {
          setPreviewError("Couldn't load spec preview. Please try again.")
        }
      } finally {
        if (!cancelled) {
          setIsPreviewLoading(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [projectId, selectedSpec])

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelectedSpec(null)
      setPreviewContent(null)
      setPreviewError(null)
      setIsPreviewLoading(false)
    }
  }

  function handleDownloadClick(event: MouseEvent, spec: SpecListItem) {
    event.stopPropagation()
    if (!projectId) {
      return
    }
    triggerSpecDownload(projectId, spec.id, spec.filename)
  }

  function handleListItemKeyDown(
    event: KeyboardEvent<HTMLLIElement>,
    spec: SpecListItem,
  ) {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }
    event.preventDefault()
    setSelectedSpec(spec)
  }

  const generateDisabled = !canGenerate || !onGenerate || isGenerating

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-3">
      <div className="flex shrink-0 flex-col gap-2">
        <Button
          type="button"
          className="w-full"
          disabled={generateDisabled}
          onClick={onGenerate}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" />
          ) : (
            <FileText className="h-4 w-4" data-icon="inline-start" />
          )}
          {isGenerating ? "Generating…" : "Generate Spec"}
        </Button>
        {generateStatus ? (
          <p className="px-1 text-xs text-copy-muted" role="status" aria-live="polite">
            {generateStatus}
          </p>
        ) : null}
        {generateError ? (
          <p className="px-1 text-xs text-error" role="alert">
            {generateError}
          </p>
        ) : null}
        {!canGenerate && projectId ? (
          <p className="px-1 text-xs text-copy-muted">
            Open a project workspace to generate specs.
          </p>
        ) : null}
      </div>

      {!projectId ? (
        <p className="px-1 text-xs text-copy-muted">
          Open a project to view generated specs.
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-copy-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading specs…</span>
        </div>
      ) : listError ? (
        <p className="px-1 text-xs text-error" role="alert">
          {listError}
        </p>
      ) : specs.length === 0 ? (
        <p className="px-1 text-xs text-copy-muted">
          No specs yet. Generate one to get started.
        </p>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul className="flex flex-col gap-1.5 px-0.5 pb-1">
            {specs.map((spec) => (
              <li
                key={spec.id}
                role="button"
                tabIndex={0}
                aria-label={`Preview ${spec.filename}`}
                onClick={() => setSelectedSpec(spec)}
                onKeyDown={(event) => handleListItemKeyDown(event, spec)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border border-surface-border bg-elevated px-2.5 py-2",
                  "outline-none transition-colors hover:border-border-subtle focus-visible:ring-2 focus-visible:ring-brand/40",
                )}
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-ai-text" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-copy-primary">
                    {spec.filename}
                  </p>
                  <p className="truncate text-[11px] text-copy-muted">
                    {formatSpecCreatedAt(spec.createdAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Download ${spec.filename}`}
                  onClick={(event) => handleDownloadClick(event, spec)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}

      <EditorDialog
        open={selectedSpec !== null}
        onOpenChange={handleOpenChange}
        title={selectedSpec?.filename ?? "Spec preview"}
        description={
          selectedSpec
            ? formatSpecCreatedAt(selectedSpec.createdAt)
            : undefined
        }
        className="sm:max-w-2xl"
        footer={
          selectedSpec && projectId ? (
            <Button
              type="button"
              onClick={() =>
                triggerSpecDownload(
                  projectId,
                  selectedSpec.id,
                  selectedSpec.filename,
                )
              }
            >
              <Download className="h-4 w-4" data-icon="inline-start" />
              Download
            </Button>
          ) : null
        }
      >
        <ScrollArea className="max-h-[min(60vh,28rem)] rounded-2xl border border-surface-border bg-base/40 px-3 py-3">
          {isPreviewLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-copy-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading preview…</span>
            </div>
          ) : previewError ? (
            <p className="text-sm text-error" role="alert">
              {previewError}
            </p>
          ) : previewContent ? (
            <div className="prose-spec text-sm text-copy-primary">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-3 text-lg font-semibold text-copy-primary">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-4 mb-2 text-[1rem] font-semibold text-copy-primary">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-3 mb-1.5 text-sm font-medium text-copy-primary">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-2 leading-relaxed text-copy-secondary">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-2 list-disc space-y-1 pl-4 text-copy-secondary">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 list-decimal space-y-1 pl-4 text-copy-secondary">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = Boolean(className)
                    if (isBlock) {
                      return (
                        <code className="font-mono text-xs text-copy-primary">
                          {children}
                        </code>
                      )
                    }
                    return (
                      <code className="rounded-md bg-subtle px-1 py-0.5 font-mono text-[11px] text-brand">
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children }) => (
                    <pre className="mb-3 overflow-x-auto rounded-xl border border-surface-border bg-elevated p-3 font-mono text-xs text-copy-primary">
                      {children}
                    </pre>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-brand underline underline-offset-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="mb-2 border-l-2 border-border-subtle pl-3 text-copy-muted">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-4 border-surface-border" />,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-copy-primary">
                      {children}
                    </strong>
                  ),
                }}
              >
                {previewContent}
              </ReactMarkdown>
            </div>
          ) : null}
        </ScrollArea>
      </EditorDialog>
    </div>
  )
}
