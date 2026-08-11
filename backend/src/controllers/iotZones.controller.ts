import type { Context } from "hono";
import * as zonesService from "../services/iotZones.service.js";

/**
 * POST /api/iot-zones
 * Body: { exploitationId, name, color?, polygon: [{lat,lng}, ...] }
 */
export async function createZoneHandler(c: Context) {
  const body = await c.req.json();

  const result = await zonesService.createZone({
    exploitationId: body.exploitationId,
    name: body.name,
    color: body.color,
    polygon: body.polygon,
  });

  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.zone }, result.status);
}

/**
 * GET /api/iot-zones?exploitationId=1
 */
export async function listZonesHandler(c: Context) {
  const exploitationId = c.req.query("exploitationId");
  if (!exploitationId) {
    return c.json({ error: "exploitationId requis." }, 400);
  }

  const result = await zonesService.listZones(Number(exploitationId));
  return c.json({ data: result.zones }, result.status);
}

/**
 * PUT /api/iot-zones/:id
 */
export async function updateZoneHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const body = await c.req.json();
  const result = await zonesService.updateZone(id, {
    name: body.name,
    color: body.color,
    polygon: body.polygon,
  });

  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.zone }, result.status);
}

/**
 * DELETE /api/iot-zones/:id
 */
export async function deleteZoneHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const result = await zonesService.deleteZone(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ success: true }, 200);
}