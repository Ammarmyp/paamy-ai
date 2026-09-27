import { logger, metadata, schemaTask } from "@trigger.dev/sdk"

import { generateTechnicalSpec } from "@/lib/ai-spec-agent"
import { persistGeneratedSpec } from "@/lib/project-specs"
import { generateSpecTaskPayloadSchema } from "@/types/spec-generation"

export const generateSpecTask = schemaTask({
  id: "generate-spec",
  schema: generateSpecTaskPayloadSchema,
  maxDuration: 300,
  run: async (payload) => {
    const { projectId, roomId } = payload

    logger.log("Spec generation started", {
      projectId,
      roomId,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
      chatMessageCount: payload.chatHistory.length,
    })

    metadata
      .set("status", "start")
      .set("label", "Ghost AI started writing the spec…")
      .set("projectId", projectId)
      .set("roomId", roomId)

    try {
      metadata
        .set("status", "processing")
        .set("label", "Analyzing canvas and chat context…")

      const markdown = await generateTechnicalSpec(payload)

      metadata.set("label", "Saving generated spec…")

      const { spec: record } = await persistGeneratedSpec({
        projectId,
        markdown,
      })

      metadata
        .set("status", "complete")
        .set("label", "Spec generation complete.")
        .set("specId", record.id)

      logger.log("Spec generation completed", {
        projectId,
        roomId,
        specId: record.id,
        specLength: markdown.length,
      })

      return {
        projectId,
        roomId,
        specId: record.id,
        filePath: record.filePath,
        spec: markdown,
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Spec generation failed"

      logger.error("Spec generation failed", {
        projectId,
        roomId,
        error: message,
      })

      metadata
        .set("status", "error")
        .set("label", "Spec generation failed.")
        .set("error", message)

      throw error
    }
  },
})
