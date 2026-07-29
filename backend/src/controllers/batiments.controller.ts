import type { Context } from "hono";
import {
  createBatimentSchema,
  updateBatimentSchema,
  listBatimentsQuerySchema,
} from "../validators/batiments.validator.js";
import * as batimentsService from "../services/batiments.service.js";

export async function createBatimentHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createBatimentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await batimentsService.createBatiment(parsed.data);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.batiment }, result.status);
}

export async function updateBatimentHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const parsed = updateBatimentSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await batimentsService.updateBatiment(id, parsed.data);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.batiment }, result.status);
}

export async function getBatimentByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await batimentsService.getBatimentById(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.batiment }, result.status);
}

export async function deleteBatimentHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await batimentsService.deleteBatiment(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: { deleted: true } }, result.status);
}

export async function listBatimentsHandler(c: Context) {
  const parsed = listBatimentsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await batimentsService.listBatiments(parsed.data);
  return c.json(
    { data: result.batiments, pagination: result.pagination },
    result.status
  );
}