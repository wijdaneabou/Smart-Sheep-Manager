import type { Context } from "hono";
import {
  createIndividualWeightSchema,
  updateIndividualWeightSchema,
  listIndividualWeightsQuerySchema,
} from "../validators/fatteningBatchIndividualWeights.validator.js";
import * as individualWeightsService from "../services/fatteningBatchIndividualWeights.service.js";
import { findIndividualWeightById } from "../repositories/fatteningBatchIndividualWeights.repository.js";
import { findFatteningBatchById } from "../repositories/fatteningBatches.repository.js";
import { getUserExploitationIds } from "../utils/permissions.js";

export async function createIndividualWeightHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const body = await c.req.json();
  const parsed = createIndividualWeightSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const batch = await findFatteningBatchById(parsed.data.fatteningBatchId);
  if (!batch) {
    return c.json({ error: "Lot d'engraissement introuvable." }, 404);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (batch.exploitationId && !allowedIds.includes(batch.exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à ce lot." }, 403);
  }

  const result = await individualWeightsService.createIndividualWeight(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.record }, result.status);
}

export async function updateIndividualWeightHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const existing = await findIndividualWeightById(id);
  if (!existing) {
    return c.json({ error: "Enregistrement de poids introuvable." }, 404);
  }

  const batch = await findFatteningBatchById(existing.fatteningBatchId);
  if (!batch) {
    return c.json({ error: "Lot d'engraissement introuvable." }, 404);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (batch.exploitationId && !allowedIds.includes(batch.exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à ce lot." }, 403);
  }

  const body = await c.req.json();
  const parsed = updateIndividualWeightSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await individualWeightsService.updateIndividualWeight(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.record }, result.status);
}

export async function listIndividualWeightsHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const parsed = listIndividualWeightsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const batch = await findFatteningBatchById(parsed.data.batchId);
  if (!batch) {
    return c.json({ error: "Lot d'engraissement introuvable." }, 404);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (batch.exploitationId && !allowedIds.includes(batch.exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à ce lot." }, 403);
  }

  const result = await individualWeightsService.getIndividualWeightsByBatch(
    parsed.data.batchId,
    parsed.data.limit ?? 20,
    parsed.data.offset ?? 0
  );
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json(
    {
      data: result.records,
      pagination: result.pagination,
    },
    200
  );
}

export async function deleteIndividualWeightHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const existing = await findIndividualWeightById(id);
  if (!existing) {
    return c.json({ error: "Enregistrement de poids introuvable." }, 404);
  }

  const batch = await findFatteningBatchById(existing.fatteningBatchId);
  if (!batch) {
    return c.json({ error: "Lot d'engraissement introuvable." }, 404);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (batch.exploitationId && !allowedIds.includes(batch.exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à ce lot." }, 403);
  }

  const result = await individualWeightsService.deleteIndividualWeight(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, result.status);
}
