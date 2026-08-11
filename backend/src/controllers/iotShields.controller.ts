import type { Context } from "hono";
import {
  createIotShieldSchema,
  updateIotShieldSchema,
  listIotShieldsQuerySchema,
} from "../validators/iotShields.validator.js";
import * as iotShieldsService from "../services/iotShields.service.js";

export async function createIotShieldHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createIotShieldSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const user = c.get("user");
  const result = await iotShieldsService.createIotShield(
    parsed.data,
    user.id
  );
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}

export async function updateIotShieldHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const parsed = updateIotShieldSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await iotShieldsService.updateIotShield(id, parsed.data);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}

export async function getIotShieldByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await iotShieldsService.getIotShieldById(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}

export async function deleteIotShieldHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await iotShieldsService.deleteIotShield(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: { deleted: true } }, result.status);
}

export async function listIotShieldsHandler(c: Context) {
  const parsed = listIotShieldsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await iotShieldsService.listIotShields(parsed.data);
  return c.json(
    { data: result.shields, pagination: result.pagination },
    result.status
  );
}

/**
 * Associate (or dissociate) an animal with an IoT shield.
 * PATCH /api/iot-shields/:id/associate
 * Body: { animalId: number | null }
 */
export async function associateAnimalHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const animalId = body.animalId === null || body.animalId === undefined ? null : Number(body.animalId);

  if (body.animalId !== null && body.animalId !== undefined && Number.isNaN(animalId)) {
    return c.json({ error: "L'identifiant animal est invalide." }, 400);
  }

  const result = await iotShieldsService.associateAnimal(id, animalId);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}

/**
 * Update the battery level of a shield.
 * PATCH /api/iot-shields/:id/battery
 * Body: { battery: number }
 */
export async function updateBatteryHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const battery = Number(body.battery);

  if (Number.isNaN(battery)) {
    return c.json({ error: "Le niveau de batterie est invalide." }, 400);
  }

  const result = await iotShieldsService.updateBatteryLevel(id, battery);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}

/**
 * Toggle the active/inactive status of a shield.
 * PATCH /api/iot-shields/:id/toggle-status
 */
export async function toggleStatusHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await iotShieldsService.toggleShieldStatus(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}
