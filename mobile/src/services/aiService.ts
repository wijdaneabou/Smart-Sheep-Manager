import api from "./api";

export type AiConversation = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type AiMessage = {
  id: number;
  conversationId: number;
  role: "user" | "model";
  content: string;
  createdAt: string;
};

function extractError(err: any): string {
  console.log("AI chat error:", {
    message: err?.message,
    code: err?.code,
    status: err?.response?.status,
    data: err?.response?.data,
    baseURL: err?.config?.baseURL,
    url: err?.config?.url,
  });
  return err?.response?.data?.error ?? "Impossible de contacter l'assistant.";
}

export async function sendChatMessage(message: string, conversationId?: number) {
  try {
    const response = await api.post<{ data: { conversationId: number; reply: string } }>(
      "/ai/chat",
      { message, conversationId }
    );
    return { success: true as const, ...response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function listConversations() {
  try {
    const response = await api.get<{ data: AiConversation[] }>("/ai/conversations");
    return { success: true as const, conversations: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getConversationMessages(conversationId: number) {
  try {
    const response = await api.get<{ data: AiMessage[] }>(`/ai/conversations/${conversationId}/messages`);
    return { success: true as const, messages: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}