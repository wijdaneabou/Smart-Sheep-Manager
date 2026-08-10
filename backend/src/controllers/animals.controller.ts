import type { Context } from "hono";
import {
  createAnimalSchema,
  updateAnimalSchema,
  listAnimalsQuerySchema,
} from "../validators/animals.validator.js";
import * as animalsService from "../services/animals.service.js";
import { getUserExploitationIds } from "../utils/permissions.js";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

async function savePhotoIfPresent(photo: unknown): Promise<string | undefined> {
  if (!(photo instanceof File)) return undefined;

  const extension = path.extname(photo.name) || ".jpg";
  const fileName = `${crypto.randomUUID()}${extension}`;

  const uploadDir = path.join(process.cwd(), "uploads", "animals");
  await fs.mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await photo.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, fileName), buffer);

  return `/uploads/animals/${fileName}`;
}

// ──────────────────────────────────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────────────────────────────────
export async function createAnimalHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.parseBody();
  const photoUrl = await savePhotoIfPresent(body.photo);

  const exploitationId = body.exploitationId ? Number(body.exploitationId) : undefined;
  if (exploitationId) {
    const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
    if (!allowedIds.includes(exploitationId)) {
      return c.json({ error: "Vous n'avez pas accès à cette exploitation." }, 403);
    }
  } else {
    return c.json({ error: "L'exploitation est requise." }, 400);
  }

  const parsed = createAnimalSchema.safeParse({
    rfid: body.rfid,
    name: body.name,
    breed: body.breed,
    sex: body.sex,
    birthDate: body.birthDate,
    fatherRfid: body.fatherRfid,
    motherRfid: body.motherRfid,
    weight: body.weight,
    bcs: body.bcs,
    healthStatus: body.healthStatus,
    exploitationId,
    photoUrl,
  });

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await animalsService.createAnimal(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.animal }, result.status);
}

// ──────────────────────────────────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────────────────────────────────
export async function updateAnimalHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const existing = await animalsService.getAnimalById(id);
  if (!existing.success) {
    return c.json({ error: existing.message }, existing.status);
  }
  const animal = existing.animal!;

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (!allowedIds.includes(animal.exploitationId!)) { // 👈 ! ajouté
    return c.json({ error: "Vous n'avez pas accès à cet animal." }, 403);
  }

  const body = await c.req.parseBody();
  const photoUrl = await savePhotoIfPresent(body.photo);

  const newExploitationId = body.exploitationId ? Number(body.exploitationId) : undefined;
  if (newExploitationId && !allowedIds.includes(newExploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à cette exploitation." }, 403);
  }

  const parsed = updateAnimalSchema.safeParse({
    rfid: body.rfid,
    name: body.name,
    breed: body.breed,
    sex: body.sex,
    birthDate: body.birthDate,
    fatherRfid: body.fatherRfid,
    motherRfid: body.motherRfid,
    weight: body.weight,
    bcs: body.bcs,
    healthStatus: body.healthStatus,
    exploitationId: newExploitationId,
    photoUrl,
  });

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await animalsService.updateAnimal(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.animal }, result.status);
}

// ──────────────────────────────────────────────────────────────────────────
// GET ONE
// ──────────────────────────────────────────────────────────────────────────
export async function getAnimalByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const result = await animalsService.getAnimalById(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  const animal = result.animal!;

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (!allowedIds.includes(animal.exploitationId!)) { // 👈 ! ajouté
    return c.json({ error: "Vous n'avez pas accès à cet animal." }, 403);
  }

  return c.json({ data: animal }, result.status);
}

// ──────────────────────────────────────────────────────────────────────────
// LIST
// ──────────────────────────────────────────────────────────────────────────
export async function listAnimalsHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const parsed = listAnimalsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");

  const result = await animalsService.listAnimals(parsed.data, allowedIds);

  return c.json(
    {
      data: result.animals,
      pagination: result.pagination,
    },
    result.status
  );
}

// ──────────────────────────────────────────────────────────────────────────
// DELETE
// ──────────────────────────────────────────────────────────────────────────
export async function deleteAnimalHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const existing = await animalsService.getAnimalById(id);
  if (!existing.success) {
    return c.json({ error: existing.message }, existing.status);
  }
  const animal = existing.animal!;

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (!allowedIds.includes(animal.exploitationId!)) { // 👈 ! ajouté
    return c.json({ error: "Vous n'avez pas accès à cet animal." }, 403);
  }

  const result = await animalsService.deleteAnimal(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: "Animal supprimé." }, result.status);
}

// ──────────────────────────────────────────────────────────────────────────
// PEDIGREE
// ──────────────────────────────────────────────────────────────────────────
export async function getPedigreeHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const existing = await animalsService.getAnimalById(id);
  if (!existing.success) {
    return c.json({ error: existing.message }, existing.status);
  }
  const animal = existing.animal!;

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (!allowedIds.includes(animal.exploitationId!)) { // 👈 ! ajouté
    return c.json({ error: "Vous n'avez pas accès à cet animal." }, 403);
  }

  const generations = c.req.query("generations")
    ? Number(c.req.query("generations"))
    : 3;

  const result = await animalsService.getPedigree(id, generations);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.data }, result.status);
}