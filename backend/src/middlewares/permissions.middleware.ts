// backend/src/middlewares/permissions.middleware.ts
import type { Context, Next } from "hono";
import { hasPermission } from "../constants/permissions.js";

export function requirePermission(module: string, action: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as
      | { id: number; roleId: number; roleName?: string | null }
      | undefined;

    if (!user) {
      return c.json({ error: "Authentification requise." }, 401);
    }

    // Admin a tous les droits (via le rôle 'admin')
    if (user.roleName?.toLowerCase() === 'admin') {
      await next();
      return;
    }

    // Vérification statique
    const allowed = hasPermission(user.roleName || '', module, action);
    if (!allowed) {
      return c.json(
        { error: `Vous n'avez pas la permission de ${action} sur le module ${module}.` },
        403
      );
    }

    await next();
  };
}