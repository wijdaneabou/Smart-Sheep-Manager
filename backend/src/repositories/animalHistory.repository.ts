import { db } from "../db/connection.js";
import {
  animalHealthRecords,
  animalReproductionRecords,
  animalWeightRecords,
} from "../db/schema/index.js";
import { eq, desc, and, or, gte, lte, SQL } from "drizzle-orm";

export type HistoryCategory = "health" | "treatment" | "reproduction" | "weight";

export interface HistoryFilters {
  category?: HistoryCategory;
  from?: Date;
  to?: Date;
}

/**
 * Événement unifié pour la timeline.
 */
export interface HistoryEvent {
  id: number;
  category: HistoryCategory;
  title: string;
  description: string | null;
  date: string;
  createdAt: string;
  // Health / Treatment fields
  healthCategory?: string;
  veterinarian?: string | null;
  medication?: string | null;
  dosage?: string | null;
  status?: string | null;
  // Reproduction fields
  eventType?: string;
  partnerId?: number | null;
  result?: string | null;
  // Weight fields
  weight?: string | null;
  bcs?: string | null;
}

/**
 * Récupère les enregistrements de santé / traitements pour un animal.
 */
export async function findHealthRecords(
  animalId: number,
  filters: HistoryFilters
) {
  const conditions: SQL[] = [eq(animalHealthRecords.animalId, animalId)];

  if (filters.category === "health") {
    conditions.push(
      or(
        eq(animalHealthRecords.category, "HEALTH_CHECK"),
        eq(animalHealthRecords.category, "ILLNESS")
      )!
    );
  } else if (filters.category === "treatment") {
    conditions.push(
      or(
        eq(animalHealthRecords.category, "TREATMENT"),
        eq(animalHealthRecords.category, "VACCINATION")
      )!
    );
  }

  if (filters.from) conditions.push(gte(animalHealthRecords.date, filters.from));
  if (filters.to) conditions.push(lte(animalHealthRecords.date, filters.to));

  return await db
    .select()
    .from(animalHealthRecords)
    .where(and(...conditions))
    .orderBy(desc(animalHealthRecords.date));
}

/**
 * Récupère les enregistrements de reproduction pour un animal.
 */
export async function findReproductionRecords(
  animalId: number,
  filters: HistoryFilters
) {
  const conditions: SQL[] = [eq(animalReproductionRecords.animalId, animalId)];

  if (filters.from) conditions.push(gte(animalReproductionRecords.date, filters.from));
  if (filters.to) conditions.push(lte(animalReproductionRecords.date, filters.to));

  return await db
    .select()
    .from(animalReproductionRecords)
    .where(and(...conditions))
    .orderBy(desc(animalReproductionRecords.date));
}

/**
 * Récupère les enregistrements de poids pour un animal.
 */
export async function findWeightRecords(
  animalId: number,
  filters: HistoryFilters
) {
  const conditions: SQL[] = [eq(animalWeightRecords.animalId, animalId)];

  if (filters.from) conditions.push(gte(animalWeightRecords.date, filters.from));
  if (filters.to) conditions.push(lte(animalWeightRecords.date, filters.to));

  return await db
    .select()
    .from(animalWeightRecords)
    .where(and(...conditions))
    .orderBy(desc(animalWeightRecords.date));
}

/**
 * Récupère l'historique complet d'un animal sous forme de timeline unifiée.
 * Les événements sont triés chronologiquement (du plus récent au plus ancien).
 */
export async function findAnimalHistory(
  animalId: number,
  filters: HistoryFilters
): Promise<HistoryEvent[]> {
  const events: HistoryEvent[] = [];

  // --- Santé / Traitements ---
  if (!filters.category || filters.category === "health" || filters.category === "treatment") {
    const healthRows = await findHealthRecords(animalId, filters);
    for (const row of healthRows) {
      const isTreatment =
        row.category === "TREATMENT" || row.category === "VACCINATION";
      events.push({
        id: row.id,
        category: isTreatment ? "treatment" : "health",
        title: row.title,
        description: row.description,
        date: row.date instanceof Date ? row.date.toISOString().split("T")[0] : String(row.date),
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        healthCategory: row.category,
        veterinarian: row.veterinarian,
        medication: row.medication,
        dosage: row.dosage,
        status: row.status,
      });
    }
  }

  // --- Reproduction ---
  if (!filters.category || filters.category === "reproduction") {
    const reproRows = await findReproductionRecords(animalId, filters);
    for (const row of reproRows) {
      events.push({
        id: row.id,
        category: "reproduction",
        title: getReproductionTitle(row.eventType, row.result),
        description: row.note,
        date: row.date instanceof Date ? row.date.toISOString().split("T")[0] : String(row.date),
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        eventType: row.eventType,
        partnerId: row.partnerId,
        result: row.result,
      });
    }
  }

  // --- Poids ---
  if (!filters.category || filters.category === "weight") {
    const weightRows = await findWeightRecords(animalId, filters);
    for (const row of weightRows) {
      events.push({
        id: row.id,
        category: "weight",
        title: `${row.weight} kg`,
        description: row.note,
        date: row.date instanceof Date ? row.date.toISOString().split("T")[0] : String(row.date),
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        weight: row.weight,
        bcs: row.bcs,
      });
    }
  }

  // Tri chronologique : du plus récent au plus ancien
  events.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateB !== dateA) return dateB - dateA;
    // En cas d'égalité, trier par createdAt décroissant
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return events;
}

/**
 * Retourne un titre lisible pour un événement de reproduction.
 */
function getReproductionTitle(eventType: string, result?: string | null): string {
  const labels: Record<string, string> = {
    BREEDING: "Saillie",
    PREGNANCY_CHECK: "Contrôle de grossesse",
    BIRTH: "Mise-bas",
    WEANING: "Séparation des agneaux",
  };
  const label = labels[eventType] ?? eventType;
  return result ? `${label} — ${result}` : label;
}
