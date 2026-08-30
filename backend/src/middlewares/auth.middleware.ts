// src/middlewares/auth.middleware.ts
import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { roles } from "../db/schema/roles.js";

type AccessTokenPayload = {
  userId: number;
  roleId: number;
};

// ✅ List of public routes under /api/predictions that should NOT require authentication
const PUBLIC_PATHS = [
  '/api/predictions/available',
  '/api/predictions/ml-health',
];

export async function isAuthenticated(c: Context, next: Next) {
  // ✅ Skip authentication for public routes
  const path = c.req.path;
  if (PUBLIC_PATHS.some(publicPath => path === publicPath || path.startsWith(publicPath))) {
    console.log(`[auth] 🔓 Public route: ${path} - skipping authentication`);
    return await next();
  }

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

    console.log(`[auth] Decoded token:`, payload);

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, payload.roleId),
    });

    console.log(`[auth] Found role:`, role);

    const user = {
      id: payload.userId,
      roleId: payload.roleId,
      roleName: role?.name ?? null,
      role: role?.name ?? null,
    };

    console.log(`[auth] Setting user:`, user);

    c.set("user", user);

    await next();
  } catch (error) {
    console.error(`[auth] Token verification error:`, error);
    return c.json({ error: "Token invalide ou expire." }, 401);
  }
}