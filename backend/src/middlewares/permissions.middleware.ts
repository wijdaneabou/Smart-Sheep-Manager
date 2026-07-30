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

    // ========== LOGS DE DIAGNOSTIC ==========
    console.log("🔍 [requirePermission] module:", module, "action:", action);
    console.log("🔍 [requirePermission] user:", user);

    if (!user) {
      console.warn("❌ [requirePermission] Utilisateur non authentifié");
      return c.json({ error: "Authentification requise." }, 401);
    }

    // ========== VÉRIFICATION ADMIN (plus robuste) ==========
    // On vérifie à la fois le roleId (1 = ADMIN) et le roleName
    const isAdmin = 
      user.roleId === 1 || 
      (user.roleName && user.roleName.toUpperCase() === "ADMIN");

    if (isAdmin) {
      console.log("✅ [requirePermission] ADMIN détecté – accès accordé");
      await next();
      return;
    }

    // ========== VÉRIFICATION PERMISSION ==========
    console.log("🔍 [requirePermission] Vérification permission pour roleId:", user.roleId);
    const allowed = await hasPermission(user.roleId, module, action);
    console.log(`🔍 [requirePermission] hasPermission(${user.roleId}, ${module}, ${action}) =`, allowed);

    if (!allowed) {
      console.warn(`❌ [requirePermission] Permission refusée pour ${module}:${action}`);
      return c.json(
        { error: `Vous n'avez pas la permission de ${action} sur le module ${module}.` },
        403
      );
    }

    console.log("✅ [requirePermission] Permission accordée");
    await next();
  };
}