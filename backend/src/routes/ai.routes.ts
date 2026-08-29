import { Hono } from "hono";
import { sendMessageHandler, listConversationsHandler, getMessagesHandler } from "../controllers/ai.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const aiRoutes = new Hono();
aiRoutes.use("*", isAuthenticated);

aiRoutes.post("/chat", sendMessageHandler);
aiRoutes.get("/conversations", listConversationsHandler);
aiRoutes.get("/conversations/:id/messages", getMessagesHandler);

export default aiRoutes;