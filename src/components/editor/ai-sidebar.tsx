"use client"

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { Bot, Download, FileText, Send, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const TAB_TRIGGER_CLASS =
  "text-copy-muted data-active:bg-accent data-active:text-brand dark:data-active:border-transparent dark:data-active:bg-accent dark:data-active:text-brand"

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
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
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-ai-text" />
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
          <ArchitectTab />
        </TabsContent>

        <TabsContent
          value="specs"
          keepMounted
          className="mt-3 flex min-h-0 flex-1 flex-col"
        >
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

function ArchitectTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
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
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        {messages.length === 0 ? (
          <EmptyArchitectState onSelectPrompt={appendUserMessage} />
        ) : (
          <ul className="flex flex-col gap-2 px-1 pb-3">
            {messages.map((message) => (
              <li key={message.id}>
                <ChatBubble message={message} />
              </li>
            ))}
            <div ref={endRef} />
          </ul>
        )}
      </ScrollArea>

      <form
        className="flex shrink-0 flex-col gap-2 border-t border-surface-border py-3"
        onSubmit={handleSubmit}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the system you want to design…"
          aria-label="Message Ghost AI"
          className="min-h-18 max-h-40 overflow-y-auto resize-none bg-elevated text-copy-primary placeholder:text-copy-muted"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!canSend}>
            <Send className="h-4 w-4" data-icon="inline-start" />
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}

function EmptyArchitectState({
  onSelectPrompt,
}: {
  onSelectPrompt: (prompt: string) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 py-8 text-center">
      <Bot className="h-8 w-8 text-ai-text" />
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
            onClick={() => onSelectPrompt(prompt)}
            className="h-auto rounded-full bg-subtle px-3 py-1.5 text-xs text-ai-text hover:bg-subtle hover:text-ai-text"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
        isUser
          ? "ml-auto bg-accent-dim border-2 border-brand/50 text-copy-primary"
          : "mr-auto border border-surface-border bg-elevated text-ai-text",
      )}
    >
      {message.content}
    </div>
  )
}

function SpecsTab() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-3">
      <Button type="button" className="w-full">
        Generate Spec
      </Button>

      <article className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-elevated p-3">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ai-text" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-copy-primary">
              Architecture Specification
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-copy-muted">
              Markdown overview of services, data stores, and request flow
              derived from the current canvas graph.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled
            aria-label="Download spec"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </article>
    </div>
  )
}
