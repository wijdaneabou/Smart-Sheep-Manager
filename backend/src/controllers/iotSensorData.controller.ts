import type { Context } from "hono";
import { createSensorDataSchema } from "../validators/iotSensorData.validator.js";
import * as sensorDataService from "../services/iotSensorData.service.js";
import { evaluateSensorDataForAlerts } from "../services/iotAlerts.service.js";
import { findExploitationByOwnerId } from "../repositories/exploitations.repository.js";

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

export async function getLatestByShieldHandler(c: Context) {
  const shieldId = Number(c.req.param("shieldId"));
  if (isNaN(shieldId)) return c.json({ error: "ID invalide" }, 400);

  const result = await sensorDataService.getLatestSensorData(shieldId);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.data }, result.status);
}

export async function getLatestAllHandler(c: Context) {
  const user = c.get("user");

  const exploitation = await findExploitationByOwnerId(user.id);
  if (!exploitation) {
    return c.json({ data: [] }, 200);
  }

  const result = await sensorDataService.getLatestAllByExploitation(exploitation.id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.data }, result.status);
}

export async function getHistoryHandler(c: Context) {
  const shieldId = Number(c.req.param("shieldId"));
  const limit = Number(c.req.query("limit") || 100);
  const offset = Number(c.req.query("offset") || 0);
  if (isNaN(shieldId)) return c.json({ error: "ID invalide" }, 400);

  const result = await sensorDataService.getHistoricalSensorData({
    shieldId,
    limit,
    since: c.req.query("since") ? new Date(c.req.query("since")!) : undefined,
  });
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.data }, result.status);
}