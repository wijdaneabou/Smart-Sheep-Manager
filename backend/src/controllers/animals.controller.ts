import type { Context } from "hono";
import {
  createAnimalSchema,
  updateAnimalSchema,
  listAnimalsQuerySchema,
} from "../validators/animals.validator.js";
import * as animalsService from "../services/animals.service.js";

export async function createAnimalHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createAnimalSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await animalsService.createAnimal(parsed.data);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.animal }, result.status);
}

export async function updateAnimalHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const parsed = updateAnimalSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await animalsService.updateAnimal(id, parsed.data);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.animal }, result.status);
}

export async function getAnimalByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await animalsService.getAnimalById(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.animal }, result.status);
}

export async function listAnimalsHandler(c: Context) {
  const parsed = listAnimalsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await animalsService.listAnimals(parsed.data);
  return c.json(
    { data: result.animals, pagination: result.pagination },
    result.status
  );
}

export async function deleteAnimalHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await animalsService.deleteAnimal(id);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ message: "Animal supprimé." }, result.status);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pedigree / Genealogical Tree
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/animals/:id/pedigree
 *
 * Returns the 3-generation pedigree tree for the given animal,
 * along with any consanguinity (inbreeding) alerts.
 *
 * Query params:
 *   - generations (optional, default 3): number of generations to include.
 */
export async function getPedigreeHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const generations = c.req.query("generations")
    ? Number(c.req.query("generations"))
    : 3;

  const result = await animalsService.getPedigree(id, generations);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.data }, result.status);
}
