import type { Context } from "hono";
import {
  createClientSchema,
  updateClientSchema,
  listClientsQuerySchema,
} from "../validators/clients.validator.js";
import * as clientsService from "../services/clients.service.js";

export async function createClientHandler(c: Context) {
  const body = await c.req.json();

  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await clientsService.createClient(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.client }, 201);
}

export async function updateClientHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();

  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await clientsService.updateClient(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.client }, 200);
}

export async function getClientByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await clientsService.getClientById(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.client }, 200);
}

export async function listClientsHandler(c: Context) {
  const parsed = listClientsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await clientsService.listClients(parsed.data);
  return c.json(
    {
      data: result.clients,
      pagination: result.pagination,
    },
    200
  );
}

export async function deleteClientHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await clientsService.deleteClient(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, 200);
}
