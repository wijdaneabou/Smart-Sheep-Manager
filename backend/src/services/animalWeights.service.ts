import {
  findWeightRecordById,
  createWeightRecord as createWeightRecordInDb,
  findWeightRecordsByAnimal,
} from "../repositories/animalWeights.repository.js";
import { findAnimalById } from "../repositories/animals.repository.js";

export type CreateWeightResult =
  | {
      success: true;
      status: 201;
      record: NonNullable<Awaited<ReturnType<typeof findWeightRecordById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function createWeightRecord(input: {
  animalId: number;
  weight: number;
  bcs?: number;
  date: string;
  note?: string;
}): Promise<CreateWeightResult> {
  const animal = await findAnimalById(input.animalId);
  if (!animal) {
    return { success: false, status: 404, message: "Animal introuvable." };
  }

  const record = await createWeightRecordInDb({
    animalId: input.animalId,
    weight: String(input.weight),
    bcs: input.bcs !== undefined ? String(input.bcs) : undefined,
    date: input.date as any,
    note: input.note,
  });

  if (!record) {
    return { success: false, status: 400, message: "Erreur lors de la création." };
  }

  return { success: true, status: 201, record };
}

/**
 * Calcule la courbe de croissance avec GMQ (Garde-Moyenne-Quotidienne).
 * GMQ = (poids_actuel - poids_précédent) / jours_entre_mesures
 */
export async function getGrowthCurve(animalId: number) {
  const animal = await findAnimalById(animalId);
  if (!animal) {
    return { success: false as const, status: 404, message: "Animal introuvable." };
  }

  const records = await findWeightRecordsByAnimal(animalId);

  // Trier par date croissante
  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const dataPoints = sorted.map((record, index) => {
    const weight = Number(record.weight);
    let gmq: number | null = null;

    if (index > 0) {
      const prev = sorted[index - 1];
      const prevWeight = Number(prev.weight);
      const daysDiff =
        (new Date(record.date).getTime() - new Date(prev.date).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysDiff > 0) {
        gmq = (weight - prevWeight) / daysDiff;
      }
    }

    return {
      id: record.id,
      date: record.date,
      dateStr: new Date(record.date).toLocaleDateString("fr-FR"),
      weight,
      bcs: record.bcs ? Number(record.bcs) : null,
      note: record.note,
      gmq,
    };
  });

  // Calculer le GMQ moyen global
  const gmqValues = dataPoints
    .filter((p) => p.gmq !== null)
    .map((p) => p.gmq as number);
  const averageGmq =
    gmqValues.length > 0
      ? gmqValues.reduce((sum, val) => sum + val, 0) / gmqValues.length
      : 0;

  return {
    success: true as const,
    status: 200 as const,
    animal: {
      id: animal.id,
      name: animal.name,
      breed: animal.breed,
      sex: animal.sex,
      birthDate: animal.birthDate,
    },
    dataPoints,
    averageGmq,
    totalMeasurements: dataPoints.length,
  };
}
