"use client"

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react"
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useOthers,
  useSelf,
} from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { Bot, Loader2, Send, X } from "lucide-react"

import { SpecsTab } from "@/components/editor/specs-tab"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { designAgentTask } from "@/trigger/design-agent"
import {
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  getAiStatusDisplayText,
  isAiGenerationActive,
  parseAiChatFeedPayload,
  parseAiStatusFeedPayload,
  type AiChatMessage,
  type AiStatusFeedPayload,
} from "@/types/tasks"

const TAB_TRIGGER_CLASS =
  "text-copy-muted data-active:bg-muted data-active:text-copy-primary dark:data-active:border-transparent"

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  /** When true, subscribe to shared Liveblocks AI status + chat (requires RoomProvider). */
  enableSharedStatus?: boolean
  /** Liveblocks room / project id — required when enableSharedStatus is true. */
  roomId?: string
}

interface LocalChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export function AiSidebar({
  isOpen,
  onClose,
  enableSharedStatus = false,
  roomId,
}: AiSidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      aria-label="AI Workspace"
      inert={!isOpen}
      className={cn(
        "pointer-events-none fixed top-12 right-0 z-40 flex h-[calc(100vh-3rem)] w-80 flex-col border-l border-surface-border bg-surface/95 backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen ? "pointer-events-auto translate-x-0" : "translate-x-full",
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-surface-border px-4 py-3">
        <div className="flex min-w-0 items-start gap-2">
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-copy-secondary" />
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-copy-primary">
              AI Workspace
            </h2>
            <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close AI sidebar"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <Tabs
        defaultValue="architect"
        className="flex min-h-0 flex-1 flex-col gap-0 px-3 pt-3"
      >
        <TabsList className="w-full">
          <TabsTrigger value="architect" className={TAB_TRIGGER_CLASS}>
            AI Architect
          </TabsTrigger>
          <TabsTrigger value="specs" className={TAB_TRIGGER_CLASS}>
            Specs
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="architect"
          keepMounted
          className="mt-3 flex min-h-0 flex-1 flex-col"
        >
          <ArchitectTab
            enableSharedStatus={enableSharedStatus}
            roomId={roomId}
          />
        </TabsContent>

        <TabsContent
          value="specs"
          keepMounted
          className="mt-3 flex min-h-0 flex-1 flex-col"
        >
          <SpecsTab
            projectId={roomId}
            enableGeneration={enableSharedStatus && Boolean(roomId)}
          />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

function useSharedAiActivity(): {
  status: AiStatusFeedPayload | null
  isGenerating: boolean
} {
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID, { limit: 1 })
  const others = useOthers()

  const latest = messages?.[messages.length - 1]
  const status = latest ? parseAiStatusFeedPayload(latest.data) : null
  const someoneThinking = others.some((other) => other.presence.thinking)
  const isGenerating = isAiGenerationActive(status) || someoneThinking

  return { status, isGenerating }
}

function ArchitectTab({
  enableSharedStatus,
  roomId,
}: {
  enableSharedStatus: boolean
  roomId?: string
}) {
  if (enableSharedStatus && roomId) {
    return <ArchitectTabWithSharedChat roomId={roomId} />
  }

  return <LocalArchitectTab />
}

function ArchitectTabWithSharedChat({ roomId }: { roomId: string }) {
  const { status, isGenerating } = useSharedAiActivity()
  const self = useSelf()
  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()
  const { messages: feedMessages } = useFeedMessages(AI_CHAT_FEED_ID)

  const [draft, setDraft] = useState("")
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  // Messages already loaded ⇒ feed exists; otherwise create lazily on first send.
  const ensuredFeedRef = useRef((feedMessages?.length ?? 0) > 0)
  const completedRunRef = useRef<string | null>(null)

  const chatMessages = (feedMessages ?? [])
    .map((message) => {
      const payload = parseAiChatFeedPayload(message.data)
      if (!payload) {
        return null
      }
      return { id: message.id, ...payload }
    })
    .filter((message): message is AiChatMessage & { id: string } =>
      Boolean(message),
    )

  if ((feedMessages?.length ?? 0) > 0) {
    ensuredFeedRef.current = true
  }

  const isRunActive = Boolean(runId && publicToken)
  const isBusy = isRunActive || isGenerating || isSubmitting

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [chatMessages.length])

  const ensureChatFeed = useEffectEvent(async () => {
    if (ensuredFeedRef.current) {
      return
    }

    // Mark before await so concurrent sends don't race createFeed.
    ensuredFeedRef.current = true
    try {
      await createFeed(AI_CHAT_FEED_ID, {
        metadata: { kind: "ai-chat" },
      })
    } catch {
      // Feed already exists (prior visit or another client) — ignore.
    }
  })

  const publishChatMessage = useEffectEvent(
    async (payload: AiChatMessage): Promise<boolean> => {
      try {
        await ensureChatFeed()
        await createFeedMessage(AI_CHAT_FEED_ID, payload, {
          createdAt: payload.timestamp,
        })
        return true
      } catch {
        return false
      }
    },
  )

  const handleRunComplete = useEffectEvent(
    async (
      completedRun: {
        id: string
        status: string
        output?: { summary?: string } | undefined
        error?: { message?: string } | undefined
      },
      err?: Error,
    ) => {
      if (completedRunRef.current === completedRun.id) {
        return
      }
      completedRunRef.current = completedRun.id

      const timestamp = Date.now()
      const failed =
        Boolean(err) ||
        completedRun.status === "FAILED" ||
        completedRun.status === "CRASHED" ||
        completedRun.status === "SYSTEM_FAILURE" ||
        completedRun.status === "TIMED_OUT" ||
        completedRun.status === "CANCELED" ||
        completedRun.status === "EXPIRED"

      const content = failed
        ? err?.message ||
          completedRun.error?.message ||
          "Design failed. Please try again."
        : completedRun.output?.summary?.trim() ||
          status?.label ||
          "Design complete."

      await publishChatMessage({
        sender: "Ghost AI",
        role: "assistant",
        content,
        timestamp,
      })

      setRunId(null)
      setPublicToken(null)
      setIsSubmitting(false)
    },
  )

  const { run, error: realtimeError } = useRealtimeRun<typeof designAgentTask>(
    runId ?? undefined,
    {
      accessToken: publicToken ?? undefined,
      enabled: isRunActive,
      skipColumns: ["payload"],
      onComplete: (completedRun, err) => {
        void handleRunComplete(completedRun, err)
      },
    },
  )

  useEffect(() => {
    if (!realtimeError || !runId) {
      return
    }

    void (async () => {
      if (completedRunRef.current === runId) {
        return
      }
      completedRunRef.current = runId

      await publishChatMessage({
        sender: "Ghost AI",
        role: "assistant",
        content: realtimeError.message || "Couldn't track design run.",
        timestamp: Date.now(),
      })

      setRunId(null)
      setPublicToken(null)
      setIsSubmitting(false)
    })()
  }, [realtimeError, runId])

  async function submitDesignPrompt(content: string) {
    if (isBusy) {
      return
    }

    const trimmed = content.trim()
    if (!trimmed) {
      return
    }

    const sender = self?.info.name?.trim() || "Anonymous"
    const timestamp = Date.now()

    setIsSubmitting(true)
    setSendError(null)

    const userPayload: AiChatMessage = {
      sender,
      role: "user",
      content: trimmed,
      timestamp,
    }

    const posted = await publishChatMessage(userPayload)
    if (!posted) {
      setSendError("Couldn't send message. Try again.")
      setIsSubmitting(false)
      return
    }

    setDraft("")

    try {
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, roomId }),
      })

      const data: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const message = readErrorMessage(data) ?? "Couldn't start design run."
        await publishChatMessage({
          sender: "Ghost AI",
          role: "assistant",
          content: message,
          timestamp: Date.now(),
        })
        setIsSubmitting(false)
        return
      }

      const runCredentials = parseDesignResponse(data)
      if (!runCredentials) {
        await publishChatMessage({
          sender: "Ghost AI",
          role: "assistant",
          content: "Design started but run credentials were missing.",
          timestamp: Date.now(),
        })
        setIsSubmitting(false)
        return
      }

      completedRunRef.current = null
      setRunId(runCredentials.runId)
      setPublicToken(runCredentials.publicToken)
      setIsSubmitting(false)
    } catch {
      await publishChatMessage({
        sender: "Ghost AI",
        role: "assistant",
        content: "Couldn't reach the design agent. Try again.",
        timestamp: Date.now(),
      })
      setIsSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitDesignPrompt(draft)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return
    }

    event.preventDefault()
    void submitDesignPrompt(draft)
  }

  const canSend = draft.trim().length > 0 && !isBusy
  const showStatusStrip = isRunActive || isAiGenerationActive(status)
  const statusDisplay =
    status != null
      ? getAiStatusDisplayText(status)
      : run
        ? `Ghost AI is ${run.status.toLowerCase().replaceAll("_", " ")}…`
        : "Ghost AI is working…"

  return (
    <ArchitectChatLayout
      messages={chatMessages}
      emptyState={
        <EmptyArchitectState
          onSelectPrompt={(prompt) => {
            void submitDesignPrompt(prompt)
          }}
          disabled={isBusy}
        />
      }
      endRef={endRef}
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      canSend={canSend}
      isBusy={isBusy}
      sendError={sendError}
      showMeta
      statusStrip={
        showStatusStrip ? (
          <RunStatusStrip text={statusDisplay} />
        ) : null
      }
    />
  )
}

function LocalArchitectTab() {
  const [messages, setMessages] = useState<LocalChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages])

  function appendUserMessage(content: string) {
    const trimmed = content.trim()
    if (!trimmed) {
      return
    }

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ])
    setDraft("")
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    appendUserMessage(draft)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return
    }

    event.preventDefault()
    appendUserMessage(draft)
  }

  const canSend = draft.trim().length > 0

  return (
    <ArchitectChatLayout
      messages={messages}
      emptyState={
        <EmptyArchitectState onSelectPrompt={appendUserMessage} />
      }
      endRef={endRef}
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      canSend={canSend}
      isBusy={false}
      sendError={null}
      showMeta={false}
      statusStrip={null}
    />
  )
}

function ArchitectChatLayout({
  messages,
  emptyState,
  endRef,
  draft,
  onDraftChange,
  onSubmit,
  onKeyDown,
  canSend,
  isBusy,
  sendError,
  showMeta,
  statusStrip,
}: {
  messages: Array<LocalChatMessage | (AiChatMessage & { id: string })>
  emptyState: ReactNode
  endRef: RefObject<HTMLDivElement | null>
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  canSend: boolean
  isBusy: boolean
  sendError: string | null
  showMeta: boolean
  statusStrip: ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        {messages.length === 0 ? (
          emptyState
        ) : (
          <ul className="flex flex-col gap-2 px-1 pb-3">
            {messages.map((message) => (
              <li key={message.id}>
                <ChatBubble message={message} showMeta={showMeta} />
              </li>
            ))}
            <div ref={endRef} />
          </ul>
        )}
      </ScrollArea>

      <form
        className="flex shrink-0 flex-col gap-2 border-t border-surface-border py-3"
        onSubmit={onSubmit}
      >
        {statusStrip}

        <Textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe the system you want to design…"
          aria-label="Message Ghost AI"
          disabled={isBusy}
          className="min-h-18 max-h-40 overflow-y-auto resize-none bg-elevated text-copy-primary placeholder:text-copy-muted disabled:opacity-60"
        />
        {sendError ? (
          <p className="text-xs text-error" role="alert">
            {sendError}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!canSend}
            className={cn(
              "border-transparent bg-foreground text-background",
              canSend ? "hover:opacity-90" : "opacity-40",
            )}
          >
            {isBusy ? (
              <Loader2
                className="h-4 w-4 animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <Send className="h-4 w-4" data-icon="inline-start" />
            )}
            {isBusy ? "Working…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function RunStatusStrip({ text }: { text: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-surface-border bg-elevated px-3 py-2"
      role="status"
      aria-live="polite"
    >
      <span
        className="relative flex h-2 w-2 shrink-0"
        aria-hidden
      >
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-60"
          aria-hidden
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground" />
      </span>
      <p className="min-w-0 truncate text-xs text-copy-secondary">{text}</p>
    </div>
  )
}

function EmptyArchitectState({
  onSelectPrompt,
  disabled = false,
}: {
  onSelectPrompt: (prompt: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 py-8 text-center">
      <Bot className="h-8 w-8 text-copy-muted" />
      <p className="text-sm text-copy-muted">
        Describe a system in plain English. Ghost AI will sketch it on the
        canvas.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
            className="h-auto rounded-full bg-subtle px-3 py-1.5 text-xs text-copy-secondary hover:bg-subtle hover:text-copy-primary"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  )
}

function ChatBubble({
  message,
  showMeta,
}: {
  message: LocalChatMessage | (AiChatMessage & { id: string })
  showMeta: boolean
}) {
  const isUser = message.role === "user"
  const sender = "sender" in message ? message.sender : null
  const timestamp = "timestamp" in message ? message.timestamp : null

  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
        isUser
          ? "ml-auto bg-foreground text-background"
          : "mr-auto border border-surface-border bg-elevated text-copy-primary",
      )}
    >
      {showMeta && sender ? (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "truncate text-[11px] font-medium",
              isUser ? "opacity-80" : "text-copy-secondary",
            )}
          >
            {sender}
          </span>
          {timestamp !== null ? (
            <time
              dateTime={new Date(timestamp).toISOString()}
              className={cn(
                "shrink-0 text-[10px]",
                isUser ? "opacity-70" : "text-copy-faint",
              )}
            >
              {formatChatTimestamp(timestamp)}
            </time>
          ) : null}
        </div>
      ) : null}
      <p className="whitespace-pre-wrap break-words">{message.content}</p>
    </div>
  )
}

function formatChatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function parseDesignResponse(
  data: unknown,
): { runId: string; publicToken: string } | null {
  if (data === null || typeof data !== "object") {
    return null
  }

  const record = data as Record<string, unknown>
  const runId = typeof record.runId === "string" ? record.runId.trim() : ""
  const publicToken =
    typeof record.publicToken === "string" ? record.publicToken.trim() : ""

  if (!runId || !publicToken) {
    return null
  }

  return { runId, publicToken }
}

function readErrorMessage(data: unknown): string | null {
  if (data === null || typeof data !== "object") {
    return null
  }

  const error = (data as Record<string, unknown>).error
  return typeof error === "string" && error.trim().length > 0
    ? error.trim()
    : null
}
