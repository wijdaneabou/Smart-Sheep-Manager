import type { Context } from "hono";
import * as fatteningAlertsService from "../services/fatteningAlerts.service.js";
import type { SerializedFatteningAlert } from "../services/fatteningAlerts.service.js";
import { getUserExploitationIds } from "../utils/permissions.js";

export async function listFatteningAlertsHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const batchId = c.req.query("batchId");
  const exploitationId = c.req.query("exploitationId");

  if (!batchId && !exploitationId) {
    return c.json({ error: "batchId ou exploitationId requis." }, 400);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");

  if (exploitationId && !allowedIds.includes(Number(exploitationId))) {
    return c.json({ error: "Vous n'avez pas accès à cette exploitation." }, 403);
  }

  const result = await fatteningAlertsService.listFatteningAlerts({
    fatteningBatchId: batchId ? Number(batchId) : undefined,
    exploitationId: exploitationId ? Number(exploitationId) : undefined,
    resolved: c.req.query("resolved") === "true" ? true : c.req.query("resolved") === "false" ? false : undefined,
    type: c.req.query("type") || undefined,
    limit: c.req.query("limit") ? Number(c.req.query("limit")) : undefined,
    offset: c.req.query("offset") ? Number(c.req.query("offset")) : undefined,
  });

  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.alerts, total: result.total }, 200);
}

export async function resolveFatteningAlertHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await fatteningAlertsService.resolveFatteningAlertById(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.alert }, 200);
}

export async function evaluateFatteningAlertsHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const batchId = Number(c.req.param("batchId"));
  if (Number.isNaN(batchId)) return c.json({ error: "Identifiant invalide." }, 400);

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");

  const batchResult = await fatteningAlertsService.listFatteningAlerts({
    fatteningBatchId: batchId,
  });
  if (!batchResult.success) {
    return c.json({ error: batchResult.message }, 400);
  }

  const batchAlert = (batchResult as { success: true; alerts: SerializedFatteningAlert[] }).alerts[0];
  if (batchAlert && batchAlert.exploitationId && !allowedIds.includes(batchAlert.exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à ce lot." }, 403);
  }

  await fatteningAlertsService.evaluateBatchForAlerts(batchId);

  const result = await fatteningAlertsService.listFatteningAlerts({
    fatteningBatchId: batchId,
    resolved: false,
  });

  return c.json(
    { data: (result as { success: true; alerts: SerializedFatteningAlert[] }).alerts, total: (result as { success: true; alerts: SerializedFatteningAlert[] }).alerts.length },
    200
  );
}

export async function getFatteningAlertSummaryHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const exploitationId = Number(c.req.query("exploitationId"));
  if (Number.isNaN(exploitationId)) {
    return c.json({ error: "exploitationId requis." }, 400);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");
  if (!allowedIds.includes(exploitationId)) {
    return c.json({ error: "Vous n'avez pas accès à cette exploitation." }, 403);
  }

  const result = await fatteningAlertsService.getFatteningAlertSummary(exploitationId);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.summary }, 200);
}
