import type { Context } from "hono";
import {
  createFrameworkContractSchema,
  updateFrameworkContractSchema,
  listFrameworkContractsQuerySchema,
} from "../validators/framework-contracts.validator.js";
import * as frameworkContractsService from "../services/framework-contracts.service.js";

export async function createFrameworkContractHandler(c: Context) {
  const body = await c.req.json();

  const parsed = createFrameworkContractSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await frameworkContractsService.createFrameworkContract(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.contract }, 201);
}

export async function updateFrameworkContractHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();

  const parsed = updateFrameworkContractSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await frameworkContractsService.updateFrameworkContract(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.contract }, 200);
}

export async function getFrameworkContractByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await frameworkContractsService.getFrameworkContractById(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.contract }, 200);
}

export async function listFrameworkContractsHandler(c: Context) {
  const parsed = listFrameworkContractsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await frameworkContractsService.listFrameworkContracts(parsed.data);
  return c.json(
    {
      data: result.contracts,
      pagination: result.pagination,
    },
    200
  );
}

export async function deleteFrameworkContractHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await frameworkContractsService.deleteFrameworkContract(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, 200);
}
