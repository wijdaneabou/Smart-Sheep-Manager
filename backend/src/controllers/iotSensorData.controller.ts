import type { Context } from "hono";
import { createSensorDataSchema } from "../validators/iotSensorData.validator.js";
import * as sensorDataService from "../services/iotSensorData.service.js";

export async function createSensorDataHandler(c: Context) {
  const shield = c.get("shield");

  const body = await c.req.json();
  const parsed = createSensorDataSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await sensorDataService.createSensorData({
    shieldId: shield.id,
    temperature: parsed.data.temperature,
    activity: parsed.data.activity,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    measuredAt: parsed.data.measuredAt || new Date(),
  });

  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }

  return c.json({ data: result.data }, 201);
}

/**
 * GET /api/sensor-data/latest/:shieldId
 * Récupère la dernière mesure d'un bouclier spécifique.
 * Vérifie que l'utilisateur a accès au bouclier via son exploitation.
 */
export async function getLatestByShieldHandler(c: Context) {
  const user = c.get("user");
  const shieldId = Number(c.req.param("shieldId"));
  if (isNaN(shieldId)) return c.json({ error: "ID invalide" }, 400);

  const result = await sensorDataService.getLatestSensorData(shieldId, user);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.data }, result.status);
}

/**
 * GET /api/sensor-data/latest
 * Récupère les dernières mesures de tous les boucliers de l'utilisateur.
 * Filtre automatiquement par les exploitations de l'utilisateur.
 */
export async function getLatestAllHandler(c: Context) {
  const user = c.get("user");

  const result = await sensorDataService.getLatestAllByExploitation(user);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.data }, result.status);
}

/**
 * GET /api/sensor-data/history/:shieldId?limit=100&offset=0&since=2024-01-01
 * Historique des mesures d'un bouclier.
 * Vérifie que l'utilisateur a accès au bouclier.
 */
export async function getHistoryHandler(c: Context) {
  const user = c.get("user");
  const shieldId = Number(c.req.param("shieldId"));
  const limit = Number(c.req.query("limit") || 100);
  const since = c.req.query("since") ? new Date(c.req.query("since")!) : undefined;

  if (isNaN(shieldId)) return c.json({ error: "ID invalide" }, 400);

  const result = await sensorDataService.getHistoricalSensorData(
    { shieldId, limit, since },
    user
  );
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.data }, result.status);
}