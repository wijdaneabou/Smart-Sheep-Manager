import type { Context } from "hono";
import {
  createMovementSchema,
  listMovementsQuerySchema,
} from "../validators/animalMovements.validator.js";
import * as animalMovementsService from "../services/animalMovements.service.js";

export async function createMovementHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createMovementSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await animalMovementsService.createMovement(parsed.data);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.movement }, result.status);
}

export async function listMovementsHandler(c: Context) {
  const parsed = listMovementsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const result = await animalMovementsService.listMovements(parsed.data);
  return c.json(
    { data: result.movements, pagination: result.pagination },
    result.status
  );
}
