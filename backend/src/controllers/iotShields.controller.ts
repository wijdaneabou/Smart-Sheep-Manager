import type { Context } from "hono";
import {
  createIotShieldSchema,
  updateIotShieldSchema,
  listIotShieldsQuerySchema,
} from "../validators/iotShields.validator.js";
import * as iotShieldsService from "../services/iotShields.service.js";

export async function createIotShieldHandler(c: Context) {
  const user = c.get("user");
  const body = await c.req.json();
  const parsed = createIotShieldSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await iotShieldsService.createIotShield(parsed.data, user);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}

export async function updateIotShieldHandler(c: Context) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const parsed = updateIotShieldSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await iotShieldsService.updateIotShield(id, parsed.data, user);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}

export async function getIotShieldByIdHandler(c: Context) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  console.log(`[getIotShieldByIdHandler] User ID: ${user.id}, Role: ${user.roleName}, Shield ID: ${id}`);

  const result = await iotShieldsService.getIotShieldById(id, user);
  if (!result.success) {
    console.log(`[getIotShieldByIdHandler] Error: ${result.message}`);
    return c.json({ error: result.message }, result.status);
  }
  console.log(`[getIotShieldByIdHandler] Success`);
  return c.json({ data: result.shield }, result.status);
}

export async function deleteIotShieldHandler(c: Context) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await iotShieldsService.deleteIotShield(id, user);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: { deleted: true } }, result.status);
}

export async function listIotShieldsHandler(c: Context) {
  const user = c.get("user");
  const parsed = listIotShieldsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await iotShieldsService.listIotShields(user, parsed.data);
  return c.json(
    { data: result.shields, pagination: result.pagination },
    result.status
  );
}

export async function associateAnimalHandler(c: Context) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const animalId = body.animalId === null || body.animalId === undefined ? null : Number(body.animalId);

  if (body.animalId !== null && body.animalId !== undefined && Number.isNaN(animalId)) {
    return c.json({ error: "L'identifiant animal est invalide." }, 400);
  }

  const result = await iotShieldsService.associateAnimal(id, animalId, user);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}

export async function updateBatteryHandler(c: Context) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const battery = Number(body.battery);

  if (Number.isNaN(battery)) {
    return c.json({ error: "Le niveau de batterie est invalide." }, 400);
  }

  const result = await iotShieldsService.updateBatteryLevel(id, battery, user);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}

export async function toggleStatusHandler(c: Context) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await iotShieldsService.toggleShieldStatus(id, user);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.shield }, result.status);
}