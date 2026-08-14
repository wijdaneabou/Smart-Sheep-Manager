import type { Context } from "hono";
import * as alertsService from "../services/iotAlerts.service.js";

/**
 * GET /api/iot-alerts?resolved=false&type=HIGH_TEMPERATURE
 * Liste les alertes de l'utilisateur (exploitations filtrées automatiquement)
 * 
 * Note: exploitationId n'est plus accepté comme paramètre car il est dérivé de l'utilisateur.
 */
export async function listAlertsHandler(c: Context) {
  const user = c.get("user");
  const resolved = c.req.query("resolved");
  const type = c.req.query("type");
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");

  const result = await alertsService.listAlerts(user, {
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
 * GET /api/iot-alerts/summary
 * Résumé des alertes non résolues par type pour l'utilisateur
 * 
 * Note: exploitationId n'est plus accepté comme paramètre car il est dérivé de l'utilisateur.
 */
export async function getAlertSummaryHandler(c: Context) {
  const user = c.get("user");

  const result = await alertsService.getAlertSummary(user);
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
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const result = await alertsService.getAlertById(id, user);
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
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const result = await alertsService.resolveAlert(id, user);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.alert }, result.status);
}