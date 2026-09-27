import { logger, task } from "@trigger.dev/sdk"

import {
  applyDesignActions,
  clearAiPresence,
  cursorForActions,
  mutateCanvasWithAi,
  planDesignActions,
  publishAiStatus,
  setAiPresence,
} from "@/lib/ai-design-agent"
import { getLiveblocksClient } from "@/lib/liveblocks"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export interface DesignAgentPayload {
  prompt: string
  roomId: string
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const { prompt, roomId } = payload
    const statusMessageId = ctx.run.id

    logger.log("Design agent started", {
      prompt,
      roomId,
      runId: statusMessageId,
    })

    const liveblocks = getLiveblocksClient()
    await liveblocks.getOrCreateRoom(roomId, {
      defaultAccesses: [],
    })

    try {
      await setAiPresence(roomId, {
        cursor: { x: 240, y: 180 },
        thinking: true,
      })

      await publishAiStatus(roomId, statusMessageId, {
        status: "start",
        label: "Ghost AI started designing…",
        runId: statusMessageId,
        prompt,
      })

      await publishAiStatus(roomId, statusMessageId, {
        status: "processing",
        label: "Interpreting prompt and planning canvas updates…",
        runId: statusMessageId,
        prompt,
      })

      let appliedCount = 0
      let summary = ""

      await mutateCanvasWithAi(roomId, async (flow) => {
        const nodes = flow.nodes as readonly CanvasNode[]
        const edges = flow.edges as readonly CanvasEdge[]

        const plan = await planDesignActions({
          prompt,
          nodes,
          edges,
        })

        summary = plan.summary
        appliedCount = plan.actions.length

        logger.log("Design plan ready", {
          summary,
          actionCount: appliedCount,
          actions: plan.actions.map((action) => action.type),
        })

        await publishAiStatus(roomId, statusMessageId, {
          status: "processing",
          label: `Applying ${appliedCount} canvas update${appliedCount === 1 ? "" : "s"}…`,
          runId: statusMessageId,
          prompt,
        })

        await setAiPresence(roomId, {
          cursor: cursorForActions(plan.actions, nodes),
          thinking: true,
        })

        applyDesignActions(flow, plan.actions)

        const updatedNodes = flow.nodes as readonly CanvasNode[]
        await setAiPresence(roomId, {
          cursor: cursorForActions(plan.actions, updatedNodes),
          thinking: true,
        })
      })

      await publishAiStatus(roomId, statusMessageId, {
        status: "complete",
        label: summary || "Design complete.",
        runId: statusMessageId,
        prompt,
      })

      logger.log("Design agent completed", {
        roomId,
        appliedCount,
        summary,
      })

      return {
        prompt,
        roomId,
        appliedCount,
        summary,
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Design agent failed"

      logger.error("Design agent failed", { roomId, error: message })

      try {
        await publishAiStatus(roomId, statusMessageId, {
          status: "error",
          label: "Design failed.",
          runId: statusMessageId,
          prompt,
          error: message,
        })
      } catch (statusError) {
        logger.error("Failed to publish error status", { statusError })
      }

      throw error
    } finally {
      try {
        await clearAiPresence(roomId)
      } catch (presenceError) {
        logger.error("Failed to clear AI presence", { presenceError })
      }
    }
  },
})
