import type { Context } from "hono";
import {
  createWeightRecordSchema,
  listWeightRecordsQuerySchema,
} from "../validators/fatteningBatchWeightRecords.validator.js";
import * as fatteningBatchWeightRecordsService from "../services/fatteningBatchWeightRecords.service.js";
import { getUserExploitationIds } from "../utils/permissions.js";

export async function createWeightRecordHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const body = await c.req.json();
  const parsed = createWeightRecordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  const batchResult = await fatteningBatchWeightRecordsService.getWeightRecordsByBatch(
    parsed.data.fatteningBatchId
  );
  
  if (!batchResult.success) {
    return c.json({ error: "Lot introuvable." }, 404);
  }

  const result = await fatteningBatchWeightRecordsService.createWeightRecord(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.record }, result.status);
}

export async function listWeightRecordsHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const parsed = listWeightRecordsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  const batchId = parsed.data.batchId;

  const result = await fatteningBatchWeightRecordsService.getWeightRecordsByBatch(batchId);
  if (!result.success) {
    return c.json({ error: result.message }, 404);
  }

  return c.json({ data: result.records }, 200);
}

export async function getGmqStatsHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const batchId = Number(c.req.param("batchId"));
  if (Number.isNaN(batchId)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await fatteningBatchWeightRecordsService.getGmqStats(batchId);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.stats }, result.status);
}

export async function deleteWeightRecordHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await fatteningBatchWeightRecordsService.deleteWeightRecord(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, result.status);
}
