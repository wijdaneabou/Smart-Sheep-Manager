import type { Context } from "hono";
import { sendMessageSchema } from "../validators/ai.validator.js";
import * as aiService from "../services/ai.service.js";

export async function sendMessageHandler(c: Context) {
  const body = await c.req.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const user = c.get("user") as { id: number };
  try {
    const result = await aiService.sendMessage(user.id, parsed.data.message, parsed.data.conversationId);
    return c.json({ data: result }, 200);
  } catch (err: any) {
    console.error("AI chat error:", err);
    if (err.message?.includes("accès non autorisé")) {
      return c.json({ error: "Accès non autorisé à cette conversation." }, 403);
    }
    return c.json({ error: "Erreur lors de la communication avec l'assistant." }, 500);
  }
}

export async function listConversationsHandler(c: Context) {
  const user = c.get("user") as { id: number };
  const conversations = await aiService.listConversations(user.id);
  return c.json({ data: conversations });
}

export async function getMessagesHandler(c: Context) {
  const conversationId = Number(c.req.param("id"));
  const user = c.get("user") as { id: number };
  try {
    const messages = await aiService.getConversationMessages(conversationId, user.id);
    return c.json({ data: messages });
  } catch (err: any) {
    console.error("Get messages error:", err);
    if (err.message?.includes("accès non autorisé")) {
      return c.json({ error: "Accès non autorisé à cette conversation." }, 403);
    }
    return c.json({ error: "Erreur lors de la récupération des messages." }, 500);
  }
}