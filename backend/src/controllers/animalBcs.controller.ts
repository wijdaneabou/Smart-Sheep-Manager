import type { Context } from "hono";
import {
  createBcsRecordSchema,
  listBcsRecordsQuerySchema,
} from "../validators/animalBcs.validator.js";
import * as animalBcsService from "../services/animalBcs.service.js";

export async function createBcsRecordHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createBcsRecordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await animalBcsService.createBcsRecord(parsed.data);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.record }, result.status);
}

export async function getBcsHistoryHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant animal invalide." }, 400);

  const result = await animalBcsService.getBcsHistory(id);
  if (!result.success) return c.json({ error: result.message }, result.status as any);
  return c.json({ data: result }, result.status as any);
}

export async function getLatestBcsHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant animal invalide." }, 400);

  const result = await animalBcsService.getLatestBcs(id);
  if (!result.success) return c.json({ error: result.message }, result.status as any);
  return c.json({ data: result }, result.status as any);
}

export async function getHerdBcsSummaryHandler(c: Context) {
  const result = await animalBcsService.getHerdBcsSummary();
  return c.json({ data: result }, result.status as any);
}
