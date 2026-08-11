import type { Context, Next } from "hono";
import { findIotShieldByApiKey } from "../repositories/iotShields.repository.js";

export async function verifyShieldApiKey(c: Context, next: Next) {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    return c.json({ error: "Clé API manquante." }, 401);
  }

  const shield = await findIotShieldByApiKey(apiKey);

  if (!shield) {
    return c.json({ error: "Clé API invalide." }, 401);
  }

  if (shield.status !== "ACTIVE") {
    return c.json({ error: "Bouclier inactif." }, 403);
  }

  c.set("shield", shield);
  await next();
}