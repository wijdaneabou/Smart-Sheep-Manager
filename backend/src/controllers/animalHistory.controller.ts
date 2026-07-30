import type { Context } from "hono";
import * as animalHistoryService from "../services/animalHistory.service.js";
import type { HistoryCategory } from "../repositories/animalHistory.repository.js";

export async function getAnimalHistoryHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const { category, from, to } = c.req.query();

  const filters = {
    category: category as HistoryCategory | undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };

  const result = await animalHistoryService.getAnimalHistory(id, filters);
  if (!result.success) return c.json({ error: result.message }, result.status);
  return c.json({ data: result.events }, result.status);
}

export async function exportAnimalHistoryPdfHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const { category, from, to } = c.req.query();

  const filters = {
    category: category as HistoryCategory | undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };

  const result = await animalHistoryService.exportAnimalHistoryPdf(id, filters);
  if ("error" in result) {
    return c.json({ error: result.error }, 404);
  }

  c.header("Content-Type", "application/pdf");
  c.header(
    "Content-Disposition",
    `attachment; filename="historique_animal_${id}.pdf"`
  );
  return c.body(new Uint8Array(result));
}
