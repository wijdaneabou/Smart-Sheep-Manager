import type { Context } from "hono";
import fs from "fs";
import path from "path";
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  loginHistoryQuerySchema,
} from "../validators/users.validator.js";
import * as usersService from "../services/users.service.js";
import { auditService } from "../services/audit.service.js";
// 👇 Imports corrigés
import { db } from "../db/connection.js";
import { users } from "../db/schema/users.js";
import { roles } from "../db/schema/roles.js";
import { eq, inArray } from "drizzle-orm"; 

function getRequestMeta(c: Context) {
  return {
    ip:
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "UNKNOWN",
    userAgent:
      c.req.header("x-device-info") ??
      c.req.header("user-agent") ??
      "UNKNOWN",
  };
}

export async function createUserHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await usersService.createUser(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }

  const currentUser = c.get("user") as { id: number } | undefined;
  const { ip, userAgent } = getRequestMeta(c);

  await auditService.log({
    userId: currentUser?.id,
    module: "Utilisateurs",
    action: "CREATE",
    description: `Création de l'utilisateur ${result.user?.email}`,
    result: "SUCCESS",
    ip,
    userAgent,
  });

  return c.json({ data: result.user }, result.status);
}

export async function updateUserHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await usersService.updateUser(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }

  const currentUser = c.get("user") as { id: number } | undefined;
  await auditService.log({
    userId: currentUser?.id,
    module: "Utilisateurs",
    action: "UPDATE",
    description: `Modification de l'utilisateur #${id}`,
    result: "SUCCESS",
  });

  return c.json({ data: result.user }, result.status);
}

export async function deactivateUserHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await usersService.deactivateUser(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }

  const currentUser = c.get("user") as { id: number } | undefined;
  await auditService.log({
    userId: currentUser?.id,
    module: "Utilisateurs",
    action: "DEACTIVATE",
    description: `Désactivation de l'utilisateur #${id}`,
    result: "SUCCESS",
  });

  return c.json({ data: result.user }, result.status);
}

export async function reactivateUserHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await usersService.reactivateUser(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }

  const currentUser = c.get("user") as { id: number } | undefined;
  await auditService.log({
    userId: currentUser?.id,
    module: "Utilisateurs",
    action: "REACTIVATE",
    description: `Réactivation de l'utilisateur #${id}`,
    result: "SUCCESS",
  });

  return c.json({ data: result.user }, result.status);
}

export async function getUserByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await usersService.getUserById(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.user }, result.status);
}

// ──────────────────────────────────────────────────────────────────────────
// ✅ MODIFICATION : Ajout de roleName dans la réponse
// ──────────────────────────────────────────────────────────────────────────
export async function listUsersHandler(c: Context) {
  const parsed = listUsersQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await usersService.listUsers(parsed.data);

  // ✅ Récupérer les IDs des utilisateurs
  const userIds = result.users.map((u: any) => u.id);
  const rolesMap: Record<number, string | null> = {};

  if (userIds.length > 0) {
    const userRoles = await db
      .select({ userId: users.id, roleName: roles.name })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(inArray(users.id, userIds)); // ✅ utilisation de inArray correctement

    userRoles.forEach((row) => {
      rolesMap[row.userId] = row.roleName ?? null;
    });
  }

  // ✅ Ajouter roleName à chaque utilisateur
  const usersWithRole = result.users.map((u: any) => ({
    ...u,
    roleName: rolesMap[u.id] ?? null,
  }));

  return c.json(
    {
      data: usersWithRole,
      pagination: result.pagination,
    },
    result.status
  );
}

export async function getLoginHistoryHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const parsed = loginHistoryQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await usersService.getLoginHistory(
    id,
    parsed.data.page,
    parsed.data.limit
  );
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.history, pagination: result.pagination }, result.status);
}

export async function uploadUserPhotoHandler(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

    const formData = await c.req.formData();
    const file = formData.get("photo");

    console.log("📦 FormData keys:", Array.from(formData.keys()));
    console.log("📄 File type:", typeof file);
    console.log("📄 File constructor:", file?.constructor?.name);

    if (!file) {
      return c.json({ error: "Aucun fichier 'photo' reçu." }, 400);
    }

    if (typeof file === "string") {
      return c.json({ error: "Le champ 'photo' doit être un fichier." }, 400);
    }

    const userResult = await usersService.getUserById(id);
    if (!userResult.success) {
      return c.json({ error: "Utilisateur introuvable." }, 404);
    }

    let buffer: Buffer;
    let filename: string;

    if (typeof file.arrayBuffer === "function") {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      filename = file.name || "profile.jpg";
    } else {
      return c.json({ error: "Format de fichier non reconnu." }, 400);
    }

    const ext = filename.split('.').pop() || 'jpg';
    const uniqueName = `user-${id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);
    const photoPath = `/uploads/avatars/${uniqueName}`;

    const result = await usersService.updatePhoto(id, photoPath);
    if (!result.success) {
      return c.json({ error: result.message }, result.status);
    }

    const currentUser = c.get("user") as { id: number } | undefined;
    await auditService.log({
      userId: currentUser?.id,
      module: "Utilisateurs",
      action: "UPLOAD_PHOTO",
      description: `Photo mise à jour pour l'utilisateur #${id}`,
      result: "SUCCESS",
    });

    return c.json({ data: result.user }, result.status);
  } catch (err) {
    console.error("❌ Upload error:", err);
    const message = err instanceof Error ? err.message : "Erreur lors de l'upload.";
    return c.json({ error: message }, 400);
  }
}