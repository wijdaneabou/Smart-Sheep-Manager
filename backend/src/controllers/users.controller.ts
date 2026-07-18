import type { Context } from "hono";
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  loginHistoryQuerySchema,
} from "../validators/users.validator.js";
import * as usersService from "../services/users.service.js";
import { saveAvatarFile } from "../utils/upload.js";

export async function createUserHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await usersService.createUser(parsed.data);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.user }, result.status);
}

export async function updateUserHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await usersService.updateUser(id, parsed.data);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.user }, result.status);
}

export async function deactivateUserHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await usersService.deactivateUser(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.user }, result.status);
}

export async function reactivateUserHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await usersService.reactivateUser(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.user }, result.status);
}

export async function getUserByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await usersService.getUserById(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.user }, result.status);
}

export async function listUsersHandler(c: Context) {
  const parsed = listUsersQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await usersService.listUsers(parsed.data);
  return c.json({ data: result.users, pagination: result.pagination }, result.status);
}

export async function getLoginHistoryHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

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
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.parseBody();
  const file = body["photo"];
  if (!file || !(file instanceof File)) {
    return c.json({ error: "Aucun fichier 'photo' recu." }, 400);
  }

  try {
    const photoPath = await saveAvatarFile(file);
    const result = await usersService.updatePhoto(id, photoPath);
    if (!result.success) return c.json({ error: result.message }, result.status);
    return c.json({ data: result.user }, result.status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'upload.";
    return c.json({ error: message }, 400);
  }
}