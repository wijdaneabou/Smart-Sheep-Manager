import type { Context } from "hono";
import {
  createFatteningFeedRecordSchema,
  updateFatteningFeedRecordSchema,
  listFatteningFeedRecordsQuerySchema,
} from "../validators/fatteningFeedRecords.validator.js";
import * as feedRecordsService from "../services/fatteningFeedRecords.service.js";
import { findFeedRecordById } from "../repositories/fatteningFeedRecords.repository.js";
import { findFatteningBatchById } from "../repositories/fatteningBatches.repository.js";
import { getUserExploitationIds } from "../utils/permissions.js";

export async function createFeedRecordHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const body = await c.req.json();
  const parsed = createFatteningFeedRecordSchema.safeParse(body);
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

  const result = await feedRecordsService.createFeedRecord(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.record }, result.status);
}

export async function updateFeedRecordHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const existing = await findFeedRecordById(id);
  if (!existing) {
    return c.json({ error: "Enregistrement d'alimentation introuvable." }, 404);
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
  const parsed = updateFatteningFeedRecordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await feedRecordsService.updateFeedRecord(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.record }, result.status);
}

export async function listFeedRecordsHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const parsed = listFatteningFeedRecordsQuerySchema.safeParse(c.req.query());
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

  const result = await feedRecordsService.getFeedRecordsByBatch(
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

export async function deleteFeedRecordHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const existing = await findFeedRecordById(id);
  if (!existing) {
    return c.json({ error: "Enregistrement d'alimentation introuvable." }, 404);
  }

  const batch = await findFatteningBatchById(existing.fatteningBatchId);
  if (!batch) {
    return c.json({ error: "Lot d'engraissement introuvable." }, 404);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (batch.exploitationId && !allowedIds.includes(batch.exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à ce lot." }, 403);
  }

  const result = await feedRecordsService.deleteFeedRecord(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, result.status);
}
