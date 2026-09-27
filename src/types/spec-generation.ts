import { z } from "zod"

import { NODE_SHAPES } from "@/types/canvas"
import { aiChatMessageSchema } from "@/types/tasks"

const nodeShapeSchema = z.enum(NODE_SHAPES)

export const specCanvasNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("canvasNode").optional(),
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  width: z.number().finite().positive().optional(),
  height: z.number().finite().positive().optional(),
  data: z.object({
    label: z.string(),
    color: z.string().min(1),
    shape: nodeShapeSchema,
  }),
})

export const specCanvasEdgeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("canvasEdge").optional(),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  data: z
    .object({
      label: z.string().optional(),
    })
    .optional(),
})

/** Client request body for POST /api/ai/spec — never trust a client projectId. */
export const generateSpecRequestSchema = z.object({
  roomId: z.string().trim().min(1),
  chatHistory: z.array(aiChatMessageSchema),
  nodes: z.array(specCanvasNodeSchema),
  edges: z.array(specCanvasEdgeSchema),
})

/** Trigger.dev task payload — projectId is server-derived from roomId. */
export const generateSpecTaskPayloadSchema = generateSpecRequestSchema.extend({
  projectId: z.string().trim().min(1),
})

export type GenerateSpecRequest = z.infer<typeof generateSpecRequestSchema>
export type GenerateSpecTaskPayload = z.infer<
  typeof generateSpecTaskPayloadSchema
>
