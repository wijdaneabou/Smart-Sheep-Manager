import type { Context, Next } from "hono";

export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as { roleName: string } | undefined;

    if (!user) {
      return c.json({ error: "Authentification requise." }, 401);
    }
    if (!allowedRoles.includes(user.roleName)) {
      return c.json(
        { error: "Vous n'avez pas les droits pour effectuer cette action." },
        403
      );
    }
    await next();
  };
}