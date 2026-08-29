import { z } from "zod";

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.number().int().positive().optional(),
});