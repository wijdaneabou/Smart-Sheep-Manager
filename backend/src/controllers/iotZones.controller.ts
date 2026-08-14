import type { Context } from "hono";
import * as zonesService from "../services/iotZones.service.js";

/**
 * POST /api/iot-zones
 * Body: { exploitationId?, name, color?, polygon: [{lat,lng}, ...] }
 * 
 * Note: exploitationId is optional; if not provided, uses the user's first exploitation.
 */
export async function createZoneHandler(c: Context) {
  const user = c.get("user");
  const body = await c.req.json();

  const result = await zonesService.createZone(
    {
      exploitationId: body.exploitationId,
      name: body.name,
      color: body.color,
      polygon: body.polygon,
    },
    user
  );

  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.zone }, result.status);
}

/**
 * GET /api/iot-zones
 * 
 * Note: exploitationId n'est plus accepté comme paramètre car il est dérivé de l'utilisateur.
 */
export async function listZonesHandler(c: Context) {
  const user = c.get("user");

  const result = await zonesService.listZones(user);
  return c.json({ data: result.zones }, result.status);
}

/**
 * PUT /api/iot-zones/:id
 */
export async function updateZoneHandler(c: Context) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const body = await c.req.json();
  const result = await zonesService.updateZone(
    id,
    {
      name: body.name,
      color: body.color,
      polygon: body.polygon,
    },
    user
  );

  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.zone }, result.status);
}

/**
 * DELETE /api/iot-zones/:id
 */
export async function deleteZoneHandler(c: Context) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) {
    return c.json({ error: "Identifiant invalide." }, 400);
  }

  const result = await zonesService.deleteZone(id, user);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ success: true }, 200);
}