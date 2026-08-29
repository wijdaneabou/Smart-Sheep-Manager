// Script ponctuel : à exécuter une seule fois pour donner un titre
// aux conversations créées avant l'ajout de la génération automatique.
//
// Usage : depuis le dossier backend/
//   npx tsx src/scripts/backfillConversationTitles.ts

import { db } from "../db/connection.js";
import { aiConversations, aiMessages } from "../db/schema/aiConversations.js";
import { eq, asc, isNull, or } from "drizzle-orm";

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

async function backfillTitles() {
  // Conversations sans titre (null ou chaîne vide)
  const untitled = await db
    .select()
    .from(aiConversations)
    .where(or(isNull(aiConversations.title), eq(aiConversations.title, "")));

  console.log(`${untitled.length} conversation(s) sans titre trouvée(s).`);

  for (const conv of untitled) {
    const [firstUserMessage] = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conv.id))
      .orderBy(asc(aiMessages.createdAt))
      .limit(1);

    if (!firstUserMessage) {
      console.log(`Conversation ${conv.id} : aucun message, ignorée.`);
      continue;
    }

    const title = generateConversationTitle(firstUserMessage.content);

    await db
      .update(aiConversations)
      .set({ title })
      .where(eq(aiConversations.id, conv.id));

    console.log(`Conversation ${conv.id} → "${title}"`);
  }

  console.log("Terminé.");
  process.exit(0);
}

backfillTitles().catch((err) => {
  console.error("Erreur lors du backfill :", err);
  process.exit(1);
});