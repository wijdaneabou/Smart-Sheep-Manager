import type { Context } from "hono";
import {
  createWeightRecordSchema,
  listWeightRecordsQuerySchema,
} from "../validators/animalWeights.validator.js";
import * as animalWeightsService from "../services/animalWeights.service.js";

export async function createWeightRecordHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createWeightRecordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await animalWeightsService.createWeightRecord(parsed.data);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.record }, result.status);
}

export async function getGrowthCurveHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await animalWeightsService.getGrowthCurve(id);
  if (!result.success) return c.json({ error: result.message }, result.status as any);
  return c.json({ data: result }, result.status as any);
}

export async function listWeightRecordsHandler(c: Context) {
  const parsed = listWeightRecordsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const { listWeightRecords } = await import("../repositories/animalWeights.repository.js");
  const { rows } = await listWeightRecords(parsed.data);
  return c.json({ data: rows }, 200);
}
