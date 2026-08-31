import type { Context } from "hono";
import {
  createOrderSchema,
  updateOrderSchema,
  listOrdersQuerySchema,
} from "../validators/orders.validator.js";
import * as ordersService from "../services/orders.service.js";

export async function createOrderHandler(c: Context) {
  const body = await c.req.json();

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await ordersService.createOrder(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.order }, 201);
}

export async function updateOrderHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();

  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await ordersService.updateOrder(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.order }, 200);
}

export async function getOrderByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await ordersService.getOrderById(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: { order: result.order, items: result.items } }, 200);
}

export async function listOrdersHandler(c: Context) {
  const parsed = listOrdersQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await ordersService.listOrders(parsed.data);
  return c.json(
    {
      data: result.orders,
      pagination: result.pagination,
    },
    200
  );
}

export async function deleteOrderHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await ordersService.deleteOrder(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, 200);
}
