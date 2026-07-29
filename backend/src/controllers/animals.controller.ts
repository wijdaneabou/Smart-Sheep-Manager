import type { Context } from "hono";
import {
  createAnimalSchema,
  updateAnimalSchema,
  listAnimalsQuerySchema,
} from "../validators/animals.validator.js";
import * as animalsService from "../services/animals.service.js";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export async function createAnimalHandler(c: Context) {
  const body = await c.req.parseBody();

  let photoUrl: string | undefined;

  // Vérifier si une image a été envoyée
  const photo = body.photo;

  if (photo instanceof File) {
    const extension = path.extname(photo.name) || ".jpg";
    const fileName = `${crypto.randomUUID()}${extension}`;

    const uploadDir = path.join(process.cwd(), "uploads", "animals");

    await fs.mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await photo.arrayBuffer());

    await fs.writeFile(
      path.join(uploadDir, fileName),
      buffer
    );

    photoUrl = `/uploads/animals/${fileName}`;
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
    exploitationId: body.exploitationId,
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

export async function updateAnimalHandler(c: Context) {
  const id = Number(c.req.param("id"));

  if (Number.isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const body = await c.req.parseBody();

let photoUrl: string | undefined;

const photo = body.photo;

if (photo instanceof File) {
  const extension = path.extname(photo.name) || ".jpg";
  const fileName = `${crypto.randomUUID()}${extension}`;

  const uploadDir = path.join(process.cwd(), "uploads", "animals");

  await fs.mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await photo.arrayBuffer());

  await fs.writeFile(
    path.join(uploadDir, fileName),
    buffer
  );

  photoUrl = `/uploads/animals/${fileName}`;
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
  exploitationId: body.exploitationId,
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

export async function getAnimalByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));

  if (Number.isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const result = await animalsService.getAnimalById(id);

  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }

  return c.json({ data: result.animal }, result.status);
}

export async function listAnimalsHandler(c: Context) {
  const parsed = listAnimalsQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await animalsService.listAnimals(parsed.data);

  return c.json(
    {
      data: result.animals,
      pagination: result.pagination,
    },
    result.status
  );
}

export async function deleteAnimalHandler(c: Context) {
  const id = Number(c.req.param("id"));

  if (Number.isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const result = await animalsService.deleteAnimal(id);

  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }

  return c.json({ message: "Animal supprimé." }, result.status);
}

export async function getPedigreeHandler(c: Context) {
  const id = Number(c.req.param("id"));

  if (Number.isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
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