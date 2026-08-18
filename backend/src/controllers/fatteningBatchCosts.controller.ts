import type { Context } from "hono";
import {
  createFatteningBatchCostSchema,
  updateFatteningBatchCostSchema,
  listFatteningBatchCostsQuerySchema,
} from "../validators/fatteningBatchCosts.validator.js";
import * as batchCostsService from "../services/fatteningBatchCosts.service.js";
import { findBatchCostById } from "../repositories/fatteningBatchCosts.repository.js";
import { findFatteningBatchById } from "../repositories/fatteningBatches.repository.js";
import { getUserExploitationIds } from "../utils/permissions.js";

export async function createBatchCostHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const body = await c.req.json();
  const parsed = createFatteningBatchCostSchema.safeParse(body);
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

  const result = await batchCostsService.createBatchCost(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.cost }, result.status);
}

export async function updateBatchCostHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const existing = await findBatchCostById(id);
  if (!existing) {
    return c.json({ error: "Coût introuvable." }, 404);
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
  const parsed = updateFatteningBatchCostSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await batchCostsService.updateBatchCost(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.cost }, result.status);
}

export async function listBatchCostsHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const parsed = listFatteningBatchCostsQuerySchema.safeParse(c.req.query());
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

  const result = await batchCostsService.getBatchCosts(
    parsed.data.batchId,
    parsed.data.limit ?? 20,
    parsed.data.offset ?? 0
  );
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json(
    {
      data: result.costs,
      pagination: result.pagination,
    },
    200
  );
}

export async function deleteBatchCostHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const existing = await findBatchCostById(id);
  if (!existing) {
    return c.json({ error: "Coût introuvable." }, 404);
  }

  const batch = await findFatteningBatchById(existing.fatteningBatchId);
  if (!batch) {
    return c.json({ error: "Lot d'engraissement introuvable." }, 404);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (batch.exploitationId && !allowedIds.includes(batch.exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à ce lot." }, 403);
  }

  const result = await batchCostsService.deleteBatchCost(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, result.status);
}
