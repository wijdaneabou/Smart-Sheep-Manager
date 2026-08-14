import type { Context } from "hono";
import {
  createFatteningBatchSchema,
  updateFatteningBatchSchema,
  listFatteningBatchesQuerySchema,
} from "../validators/fatteningBatches.validator.js";
import * as fatteningBatchesService from "../services/fatteningBatches.service.js";
import { getUserExploitationIds } from "../utils/permissions.js";

export async function createFatteningBatchHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const body = await c.req.json();

  const exploitationId = body.exploitationId ? Number(body.exploitationId) : null;
  if (exploitationId) {
    const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
    if (!allowedIds.includes(exploitationId)) {
      return c.json({ error: "Vous n'avez pas accès à cette exploitation." }, 403);
    }
  }

  const parsed = createFatteningBatchSchema.safeParse({
    ...body,
    exploitationId,
  });

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await fatteningBatchesService.createFatteningBatch(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, 400);
  }
  return c.json({ data: result.batch }, 201);
}

export async function updateFatteningBatchHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const existing = await fatteningBatchesService.getFatteningBatchById(id);
  if (!existing.success) {
    return c.json({ error: existing.message }, 404);
  }
  const batch = existing.batch!;

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (batch.exploitationId && !allowedIds.includes(batch.exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à ce lot." }, 403);
  }

  const body = await c.req.json();

  const newExploitationId = body.exploitationId !== undefined ? Number(body.exploitationId) : batch.exploitationId;
  if (newExploitationId && !allowedIds.includes(newExploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à cette exploitation." }, 403);
  }

  const parsed = updateFatteningBatchSchema.safeParse({
    ...body,
    exploitationId: newExploitationId,
  });

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await fatteningBatchesService.updateFatteningBatch(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.batch }, 200);
}

export async function getFatteningBatchByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const result = await fatteningBatchesService.getFatteningBatchById(id);
  if (!result.success) {
    return c.json({ error: result.message }, 404);
  }
  const batch = result.batch!;

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (batch.exploitationId && !allowedIds.includes(batch.exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à ce lot." }, 403);
  }

  return c.json({ data: batch }, 200);
}

export async function listFatteningBatchesHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const parsed = listFatteningBatchesQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");

  const result = await fatteningBatchesService.listFatteningBatches(parsed.data, allowedIds);

  return c.json(
    {
      data: result.batches,
      pagination: result.pagination,
    },
    200
  );
}

export async function deleteFatteningBatchHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const existing = await fatteningBatchesService.getFatteningBatchById(id);
  if (!existing.success) {
    return c.json({ error: existing.message }, 404);
  }
  const batch = existing.batch!;

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (batch.exploitationId && !allowedIds.includes(batch.exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à ce lot." }, 403);
  }

  const result = await fatteningBatchesService.deleteFatteningBatch(id);
  if (!result.success) {
    return c.json({ error: result.message }, 404);
  }
  return c.json({ message: "Lot d'engraissement supprimé." }, 200);
}
