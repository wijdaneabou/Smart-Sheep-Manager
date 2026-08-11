import type { Context } from "hono";
import * as alertsService from "../services/iotAlerts.service.js";

/**
 * GET /api/iot-alerts?exploitationId=1&resolved=false&type=HIGH_TEMPERATURE
 * Liste les alertes d'une exploitation avec filtres
 */
export async function listAlertsHandler(c: Context) {
  const exploitationId = c.req.query("exploitationId");
  const resolved = c.req.query("resolved");
  const type = c.req.query("type");
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");

  const result = await alertsService.listAlerts({
    exploitationId: exploitationId ? Number(exploitationId) : undefined,
    resolved: resolved ? resolved === "true" : undefined,
    type: type || undefined,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });

  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.alerts, total: result.total }, result.status);
}

/**
 * GET /api/iot-alerts/summary?exploitationId=1
 * Résumé des alertes non résolues par type
 */
export async function getAlertSummaryHandler(c: Context) {
  const exploitationId = c.req.query("exploitationId");
  if (!exploitationId) {
    return c.json({ error: "exploitationId requis." }, 400);
  }

  const result = await alertsService.getAlertSummary(Number(exploitationId));
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.summary }, result.status);
}

/**
 * GET /api/iot-alerts/:id
 * Détail d'une alerte
 */
export async function getAlertByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const result = await alertsService.getAlertById(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.alert }, result.status);
}

/**
 * PATCH /api/iot-alerts/:id/resolve
 * Marque une alerte comme résolue
 */
export async function resolveAlertHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const result = await alertsService.resolveAlert(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.alert }, result.status);
}