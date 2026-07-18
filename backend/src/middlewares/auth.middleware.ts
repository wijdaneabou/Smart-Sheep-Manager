import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { roles } from "../db/schema/roles.js";

type AccessTokenPayload = {
  userId: number;
  roleId: number;
};

/**
 * Verifie le token genere par generateAccessToken() (utils/jwt.ts).
 * Le payload signe ne contient que { userId, roleId } (pas de roleName),
 * donc on resout le nom du role ici via la table roles pour permettre
 * le RBAC dans requireRole() (middlewares/rbac.middleware.ts).
 */
export async function isAuthenticated(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return c.json({ error: "Authentification requise." }, 401);
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AccessTokenPayload;

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, payload.roleId),
    });

    c.set("user", {
      id: payload.userId,
      roleId: payload.roleId,
      roleName: role?.name ?? null,
    });

    await next();
  } catch {
    return c.json({ error: "Token invalide ou expire." }, 401);
  }
}