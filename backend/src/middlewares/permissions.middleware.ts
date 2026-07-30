import type { Context, Next } from "hono";
import { hasPermission, isAdminRole } from "../services/permissions.service.js";

/**
 * Middleware to check if the current user has a specific permission.
 * Usage: router.post('/animals', requirePermission('HERD', 'CREATE'), createAnimalHandler);
 */
export function requirePermission(module: string, action: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as
      | { userId: number; roleId: number; roleName?: string | null }
      | undefined;

    if (!user) {
      return c.json({ error: "Authentification requise." }, 401);
    }

    if (isAdminRole(user.roleId, user.roleName)) {
      await next();
      return;
    }

    const allowed = await hasPermission(user.roleId, module, action);

    if (!allowed) {
      return c.json(
        { error: `Vous n'avez pas la permission de ${action} sur le module ${module}.` },
        403
      );
    }

    await next();
  };
}
