import type { Context } from "hono";
import {
  createDeliverySchema,
  updateDeliverySchema,
  listDeliveriesQuerySchema,
} from "../validators/deliveries.validator.js";
import * as deliveriesService from "../services/deliveries.service.js";

export async function createDeliveryHandler(c: Context) {
  const body = await c.req.json();

  const parsed = createDeliverySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await deliveriesService.createDelivery(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.delivery }, 201);
}

export async function updateDeliveryHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();

  const parsed = updateDeliverySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await deliveriesService.updateDelivery(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.delivery }, 200);
}

export async function getDeliveryByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await deliveriesService.getDeliveryById(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.delivery }, 200);
}

export async function listDeliveriesHandler(c: Context) {
  const parsed = listDeliveriesQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await deliveriesService.listDeliveries(parsed.data);
  return c.json(
    {
      data: result.deliveries,
      pagination: result.pagination,
    },
    200
  );
}

export async function deleteDeliveryHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await deliveriesService.deleteDelivery(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, 200);
}
