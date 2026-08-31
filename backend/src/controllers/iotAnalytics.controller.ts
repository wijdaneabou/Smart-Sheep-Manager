import type { Context } from "hono";
import * as analyticsService from "../services/iotAnalytics.service.js";

function parseDays(c: Context): number {
  const raw = c.req.query("days");
  const days = raw ? Number(raw) : 7;
  return Number.isNaN(days) || days <= 0 ? 7 : days;
}

/**
 * GET /api/iot-analytics/:shieldId/temperature-trend?days=7
 */
export async function getTemperatureTrendHandler(c: Context) {
  const shieldId = Number(c.req.param("shieldId"));
  if (Number.isNaN(shieldId)) {
    return c.json({ error: "ID de bouclier invalide." }, 400);
  }
  const user = c.get("user");
  const result = await analyticsService.getTemperatureTrend(shieldId, parseDays(c), user);
  return c.json({ data: result.data }, result.status);
}

/**
 * GET /api/iot-analytics/:shieldId/grazing-time?days=7
 */
export async function getGrazingTimeHandler(c: Context) {
  const shieldId = Number(c.req.param("shieldId"));
  if (Number.isNaN(shieldId)) {
    return c.json({ error: "ID de bouclier invalide." }, 400);
  }
  const user = c.get("user");
  const result = await analyticsService.getGrazingTime(shieldId, parseDays(c), user);
  return c.json({ data: result.data }, result.status);
}

/**
 * GET /api/iot-analytics/:shieldId/distance?days=7
 */
export async function getDistanceHandler(c: Context) {
  const shieldId = Number(c.req.param("shieldId"));
  if (Number.isNaN(shieldId)) {
    return c.json({ error: "ID de bouclier invalide." }, 400);
  }
  const user = c.get("user");
  const result = await analyticsService.getDistanceTraveled(shieldId, parseDays(c), user);
  return c.json({ data: result.data, totalKm: result.totalKm }, result.status);
}

/**
 * GET /api/iot-analytics/compare?exploitationId=1&days=7
 */
export async function compareAnimalsHandler(c: Context) {
  const user = c.get("user");
  const result = await analyticsService.compareAnimals(user, parseDays(c));
  return c.json({ data: result.data }, result.status);
}