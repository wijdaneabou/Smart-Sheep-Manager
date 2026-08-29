import OpenAI from "openai";
import { db } from "../db/connection.js";
import { aiConversations, aiMessages } from "../db/schema/aiConversations.js";
import { eq, asc } from "drizzle-orm";
import { getUserExploitationIdsWithAdmin } from "../utils/userHelpers.js";
import * as biRepo from "../repositories/biRepository.js";
import * as fatteningPerfRepo from "../repositories/fatteningPerformance.repository.js";

// Groq expose une API compatible OpenAI : on réutilise le SDK "openai"
// en changeant juste la baseURL et la clé.
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = "openai/gpt-oss-120b";

// Outils exposés au modèle — chacun interroge vos repos existants,
// donc les permissions/filtrage par exploitation s'appliquent déjà.
function buildTools(): OpenAI.Chat.ChatCompletionTool[] {
  return [
    {
      type: "function",
      function: {
        name: "getHerdSummary",
        description: "Effectif du troupeau, répartition par race, sexe et statut sanitaire.",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "getHealthAlerts",
        description: "Animaux malades, en quarantaine, ou nécessitant une intervention vétérinaire.",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "getFatteningPerformance",
        description: "GMQ, FCR, coût par kg de gain pour les lots d'engraissement en cours.",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "getFinancialSummary",
        description: "Revenus, dépenses et trésorerie sur une période récente.",
        parameters: {
          type: "object",
          properties: {
            period: {
              type: "string",
              description: "Période : '30d', '90d', 'year'",
            },
          },
        },
      },
    },
  ];
}

// Exécute un outil pour CHAQUE exploitation de l'utilisateur, puis agrège.
// Si exploitationIds est vide (admin/coopérative sans filtre), on passe
// `undefined` pour laisser le repo renvoyer toutes les données autorisées.
async function executeTool(name: string, args: any, exploitationIds: number[]) {
  const targets: (number | undefined)[] = exploitationIds.length > 0 ? exploitationIds : [undefined];

  const runOne = async (expId: number | undefined) => {
    switch (name) {
      case "getHerdSummary":
        return biRepo.getHerdOverview({ exploitationId: expId });
      case "getHealthAlerts":
        return biRepo.getActiveFatteningAlerts(expId);
      case "getFatteningPerformance":
        return biRepo.getFatteningPerformance(expId);
      case "getFinancialSummary":
        return biRepo.getMonthlyFinancials(expId, {
          from: args.period === "30d" ? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0] : undefined,
          to: new Date().toISOString().split("T")[0],
        });
      default:
        return { error: `Fonction inconnue: ${name}` };
    }
  };

  if (!["getHerdSummary", "getHealthAlerts", "getFatteningPerformance", "getFinancialSummary"].includes(name)) {
    return { error: `Fonction inconnue: ${name}` };
  }

  // Une seule exploitation (cas le plus courant) : pas besoin d'agréger.
  if (targets.length === 1) {
    return runOne(targets[0]);
  }

  // Plusieurs exploitations : on renvoie un résultat par exploitation,
  // pour que le modèle puisse répondre précisément (globalement ou par site).
  const results = await Promise.all(
    targets.map(async (expId) => ({ exploitationId: expId, data: await runOne(expId) }))
  );
  return { perExploitation: results };
}

function buildSystemInstruction(exploitationIds: number[]): string {
  const scope =
    exploitationIds.length === 0
      ? "L'utilisateur a une vue globale (admin/coopérative) : les données couvrent toutes les exploitations."
      : exploitationIds.length === 1
      ? `L'utilisateur est rattaché à l'exploitation ID ${exploitationIds[0]}. Ne réponds JAMAIS avec des données d'une autre exploitation.`
      : `L'utilisateur gère plusieurs exploitations (IDs : ${exploitationIds.join(", ")}). Les résultats d'outils sont regroupés par exploitation sous "perExploitation" : additionne/compare-les correctement selon la question posée (globale ou par site).`;

  return `Tu es l'assistant IA de Smart Sheep Manager, une application de gestion d'élevage ovin.
Réponds en français, de façon concise et concrète, comme un conseiller agricole.

RÈGLES IMPORTANTES POUR LA PRÉCISION :
- Utilise TOUJOURS les outils disponibles avant de répondre à une question sur les données de l'exploitation. Ne devine jamais un chiffre.
- Si un outil renvoie un tableau ou une liste vide, dis clairement qu'il n'y a rien à signaler plutôt que d'inventer une réponse.
- Cite les chiffres exacts renvoyés par les outils, sans les arrondir de façon trompeuse.
- ${scope}
- Si une question sort du cadre de l'élevage ovin ou de l'app, réponds normalement mais brièvement, sans utiliser les outils.`;
}

// Génère un titre court à partir du premier message, à la façon de ChatGPT :
// on tronque proprement sur un mot entier plutôt qu'en plein milieu.
function generateConversationTitle(message: string): string {
  const cleaned = message.trim().replace(/\s+/g, " ");
  const MAX_LENGTH = 40;

  if (cleaned.length <= MAX_LENGTH) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  const truncated = cleaned.slice(0, MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  const safeTruncated = lastSpace > 15 ? truncated.slice(0, lastSpace) : truncated;

  return safeTruncated.charAt(0).toUpperCase() + safeTruncated.slice(1) + "…";
}

export async function sendMessage(
  userId: number,
  message: string,
  conversationId?: number
) {
  let exploitationIds = await getUserExploitationIdsWithAdmin({ id: userId } as any);
  // Admin/cooperative gets null (no filter) -> use empty array to fetch all
  if (!exploitationIds) exploitationIds = [];

  // Récupère ou crée la conversation — en vérifiant qu'elle appartient
  // bien à l'utilisateur connecté si un conversationId a été fourni.
  let convId = conversationId;
  if (convId) {
    const [existing] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, convId));
    if (!existing || existing.userId !== userId) {
      throw new Error("Conversation introuvable ou accès non autorisé.");
    }
  } else {
    const [created] = await db
      .insert(aiConversations)
      .values({ userId, title: generateConversationTitle(message) })
      .$returningId();
    convId = created.id;
  }

  // Historique existant pour le contexte
  const history = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, convId))
    .orderBy(asc(aiMessages.createdAt));

  // Format OpenAI/Groq : rôle "assistant" au lieu de "model"
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemInstruction(exploitationIds) },
    ...history.map((m) => ({
      role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const tools = buildTools();

  let completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    tools,
  });

  let choice = completion.choices[0];

  // Boucle d'appel d'outils tant que le modèle en demande
  while (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.length) {
    messages.push(choice.message);

    for (const toolCall of choice.message.tool_calls) {
      // Le SDK OpenAI récent distingue les tool_calls "function" des "custom" ;
      // Groq n'utilise que le type "function", donc on l'ignore sinon.
      if (toolCall.type !== "function") continue;

      const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
      const result = await executeTool(toolCall.function.name, args, exploitationIds);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools,
    });
    choice = completion.choices[0];
  }

  const replyText = choice.message.content ?? "";

  // Sauvegarde
  await db.insert(aiMessages).values([
    { conversationId: convId, role: "user", content: message },
    { conversationId: convId, role: "model", content: replyText },
  ]);

  // Touche la date de la conversation pour que l'historique la remonte en tête
  await db
    .update(aiConversations)
    .set({ updatedAt: new Date() })
    .where(eq(aiConversations.id, convId));

  return { conversationId: convId, reply: replyText };
}

export async function listConversations(userId: number) {
  return db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(asc(aiConversations.updatedAt));
}

export async function getConversationMessages(conversationId: number, userId: number) {
  // Sécurité : on vérifie que la conversation appartient bien à cet utilisateur
  // avant de renvoyer quoi que ce soit, pour empêcher d'accéder aux conversations
  // d'un autre utilisateur en devinant/changeant l'id dans l'URL.
  const [conversation] = await db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.id, conversationId));

  if (!conversation || conversation.userId !== userId) {
    throw new Error("Conversation introuvable ou accès non autorisé.");
  }

  return db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(asc(aiMessages.createdAt));
}