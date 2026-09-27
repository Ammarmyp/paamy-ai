import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"

import type { GenerateSpecTaskPayload } from "@/types/spec-generation"

/**
 * Generate a Markdown technical specification from canvas + chat context.
 * Uses the same Gemini setup as the design agent (no separate provider layer).
 */
export async function generateTechnicalSpec(
  input: GenerateSpecTaskPayload,
): Promise<string> {
  const apiKey = process.env.GEMINI_AI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_AI_API_KEY is not set")
  }

  const google = createGoogleGenerativeAI({ apiKey })

  const canvasSnapshot = {
    nodes: input.nodes.map((node) => ({
      id: node.id,
      label: node.data.label,
      shape: node.data.shape,
      color: node.data.color,
      x: node.position.x,
      y: node.position.y,
      width: node.width,
      height: node.height,
    })),
    edges: input.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.data?.label ?? "",
    })),
  }

  const chatTranscript =
    input.chatHistory.length === 0
      ? "(no chat history)"
      : input.chatHistory
          .map(
            (message) =>
              `[${message.role}] ${message.sender}: ${message.content}`,
          )
          .join("\n")

  const { text } = await generateText({
    model: google("gemini-3.6-flash"),
    system: [
      "You are Ghost AI, a technical specification writer for system architecture designs.",
      "Write a clear, professional Markdown technical specification from the provided canvas graph and chat context.",
      "Cover: overview, components/services, data flow, key relationships, and notable design decisions when evidence exists.",
      "Use only information supported by the canvas and chat — do not invent undocumented services or APIs.",
      "Return Markdown only. Do not wrap the document in a code fence.",
    ].join("\n"),
    prompt: [
      `Project ID: ${input.projectId}`,
      `Room ID: ${input.roomId}`,
      `Chat history:\n${chatTranscript}`,
      `Canvas graph JSON:\n${JSON.stringify(canvasSnapshot, null, 2)}`,
    ].join("\n\n"),
  })

  const spec = text.trim()
  if (!spec) {
    throw new Error("Spec generation returned empty content")
  }

  return spec
}
