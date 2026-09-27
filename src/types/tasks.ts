import { z } from "zod"

/**
 * Shared Liveblocks AI status feed payload.
 * Generic enough for design and spec generation status messages.
 */
export const AI_STATUS_FEED_ID = "ai-status-feed"

/** Room-scoped collaborative chat feed (separate from status). */
export const AI_CHAT_FEED_ID = "ai-chat"

export const AI_STATUS_PHASES = [
  "start",
  "processing",
  "complete",
  "error",
] as const

export type AiStatusPhase = (typeof AI_STATUS_PHASES)[number]

export interface AiStatusFeedPayload {
  status: AiStatusPhase
  label: string
  text?: string
  runId?: string
  prompt?: string
  error?: string
  [key: string]: string | undefined
}

function isAiStatusPhase(value: unknown): value is AiStatusPhase {
  return (
    typeof value === "string" &&
    (AI_STATUS_PHASES as readonly string[]).includes(value)
  )
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

/**
 * Validate unknown feed message data before displaying it.
 * Returns null when the payload is missing required fields or invalid.
 */
export function parseAiStatusFeedPayload(
  data: unknown,
): AiStatusFeedPayload | null {
  if (data === null || typeof data !== "object") {
    return null
  }

  const record = data as Record<string, unknown>
  if (!isAiStatusPhase(record.status) || typeof record.label !== "string") {
    return null
  }

  const text = optionalString(record.text)
  return {
    status: record.status,
    label: record.label,
    ...(text !== undefined ? { text } : {}),
    ...(optionalString(record.runId) !== undefined
      ? { runId: optionalString(record.runId) }
      : {}),
    ...(optionalString(record.prompt) !== undefined
      ? { prompt: optionalString(record.prompt) }
      : {}),
    ...(optionalString(record.error) !== undefined
      ? { error: optionalString(record.error) }
      : {}),
  }
}

export function getAiStatusDisplayText(payload: AiStatusFeedPayload): string {
  const text = payload.text?.trim()
  return text && text.length > 0 ? text : payload.label
}

export function isAiGenerationActive(
  payload: AiStatusFeedPayload | null,
): boolean {
  return payload?.status === "start" || payload?.status === "processing"
}

export const aiChatMessageSchema = z.object({
  sender: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.number().finite(),
})

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>

/**
 * Validate unknown ai-chat feed message data before displaying it.
 * Returns null when the payload is missing required fields or invalid.
 */
export function parseAiChatFeedPayload(data: unknown): AiChatMessage | null {
  const result = aiChatMessageSchema.safeParse(data)
  return result.success ? result.data : null
}
