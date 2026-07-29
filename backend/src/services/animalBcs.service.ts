import {
  createBcsRecord as createBcsRecordInDb,
  findBcsRecordsByAnimal,
  findLatestBcsRecordByAnimal,
  listAllBcsRecords,
  findBcsRecordById,
} from "../repositories/animalBcs.repository.js";
import { findAnimalById } from "../repositories/animals.repository.js";

export interface BcsCategoryInfo {
  code: "THIN" | "MODERATE" | "IDEAL" | "HEAVY" | "OBESE";
  label: string;
  color: string;
  description: string;
  defaultRecommendation: string;
}

export function classifyBcsScore(score: number): BcsCategoryInfo {
  if (score < 2.0) {
    return {
      code: "THIN",
      label: "Maigre",
      color: "#DC2626", // Rouge
      description: "Émacié / Sous-nutrition sévère",
      defaultRecommendation:
        "Augmenter immédiatement la ration énergétique et protéique. Contrôle parasitaire recommandé.",
    };
  } else if (score < 3.0) {
    return {
      code: "MODERATE",
      label: "Mince",
      color: "#EA580C", // Orange
      description: "Léger / Reserve corporelle faible",
      defaultRecommendation:
        "Compléter l'alimentation avec un apport supplémentaire en concentrés et fourrage de haute qualité.",
    };
  } else if (score < 4.0) {
    return {
      code: "IDEAL",
      label: "Idéal",
      color: "#16A34A", // Vert
      description: "État nutritionnel optimal",
      defaultRecommendation:
        "Conserver le régime d'entretien actuel. Bon équilibre nutritionnel.",
    };
  } else if (score < 4.5) {
    return {
      code: "HEAVY",
      label: "Gras",
      color: "#CA8A04", // Jaune / Ambre
      description: "Surcharge adipeuse modérée",
      defaultRecommendation:
        "Réduire légèrement les apports riches en énergie pour prévenir l'obésité.",
    };
  } else {
    return {
      code: "OBESE",
      label: "Obèse",
      color: "#B91C1C", // Rouge foncé
      description: "Sur-nutrition sévère",
      defaultRecommendation:
        "Restreindre l'apport énergétique. Risque accru de toxémie de gestation et problèmes métaboliques.",
    };
  }
}

export async function createBcsRecord(input: {
  animalId: number;
  bcsScore: number;
  spinousProcesses?: number;
  transverseProcesses?: number;
  eyeMuscle?: number;
  fatCover?: number;
  tailDock?: number;
  date: string;
  evaluator?: string;
  notes?: string;
  nutritionalRecommendation?: string;
}) {
  const animal = await findAnimalById(input.animalId);
  if (!animal) {
    return { success: false as const, status: 404 as const, message: "Animal introuvable." };
  }

  const categoryInfo = classifyBcsScore(input.bcsScore);
  const recommendation =
    input.nutritionalRecommendation?.trim() || categoryInfo.defaultRecommendation;

  const record = await createBcsRecordInDb({
    animalId: input.animalId,
    bcsScore: String(input.bcsScore),
    spinousProcesses:
      input.spinousProcesses !== undefined ? String(input.spinousProcesses) : String(input.bcsScore),
    transverseProcesses:
      input.transverseProcesses !== undefined ? String(input.transverseProcesses) : String(input.bcsScore),
    eyeMuscle:
      input.eyeMuscle !== undefined ? String(input.eyeMuscle) : String(input.bcsScore),
    fatCover:
      input.fatCover !== undefined ? String(input.fatCover) : String(input.bcsScore),
    tailDock:
      input.tailDock !== undefined ? String(input.tailDock) : String(input.bcsScore),
    date: input.date as any,
    evaluator: input.evaluator,
    notes: input.notes,
    nutritionalRecommendation: recommendation,
  });

  if (!record) {
    return { success: false as const, status: 400 as const, message: "Erreur lors de la création." };
  }

  return { success: true as const, status: 201 as const, record };
}

export async function getBcsHistory(animalId: number) {
  const animal = await findAnimalById(animalId);
  if (!animal) {
    return { success: false as const, status: 404 as const, message: "Animal introuvable." };
  }

  const records = await findBcsRecordsByAnimal(animalId);

  const formattedRecords = records.map((r) => {
    const score = Number(r.bcsScore);
    const category = classifyBcsScore(score);
    return {
      id: r.id,
      animalId: r.animalId,
      bcsScore: score,
      spinousProcesses: r.spinousProcesses ? Number(r.spinousProcesses) : score,
      transverseProcesses: r.transverseProcesses ? Number(r.transverseProcesses) : score,
      eyeMuscle: r.eyeMuscle ? Number(r.eyeMuscle) : score,
      fatCover: r.fatCover ? Number(r.fatCover) : score,
      tailDock: r.tailDock ? Number(r.tailDock) : score,
      date: r.date,
      dateStr: new Date(r.date).toLocaleDateString("fr-FR"),
      evaluator: r.evaluator,
      notes: r.notes,
      nutritionalRecommendation: r.nutritionalRecommendation,
      category,
    };
  });

  // Calculate evolution trends (difference between latest and previous)
  let trend: "UP" | "DOWN" | "STABLE" | null = null;
  if (formattedRecords.length >= 2) {
    const diff = formattedRecords[0].bcsScore - formattedRecords[1].bcsScore;
    if (diff > 0.1) trend = "UP";
    else if (diff < -0.1) trend = "DOWN";
    else trend = "STABLE";
  }

  return {
    success: true as const,
    status: 200 as const,
    animal: {
      id: animal.id,
      name: animal.name,
      officialId: animal.rfid,
      breed: animal.breed,
      sex: animal.sex,
      photoUrl: animal.photoUrl,
    },
    records: formattedRecords,
    latestRecord: formattedRecords[0] ?? null,
    trend,
  };
}

export async function getLatestBcs(animalId: number) {
  const animal = await findAnimalById(animalId);
  if (!animal) {
    return { success: false as const, status: 404 as const, message: "Animal introuvable." };
  }

  const record = await findLatestBcsRecordByAnimal(animalId);
  if (!record) {
    return {
      success: true as const,
      status: 200 as const,
      animal: {
        id: animal.id,
        name: animal.name,
        officialId: animal.rfid,
        breed: animal.breed,
        photoUrl: animal.photoUrl,
      },
      latestRecord: null,
    };
  }

  const score = Number(record.bcsScore);
  const category = classifyBcsScore(score);

  return {
    success: true as const,
    status: 200 as const,
    animal: {
      id: animal.id,
      name: animal.name,
      officialId: animal.rfid,
      breed: animal.breed,
      photoUrl: animal.photoUrl,
    },
    latestRecord: {
      id: record.id,
      bcsScore: score,
      spinousProcesses: record.spinousProcesses ? Number(record.spinousProcesses) : score,
      transverseProcesses: record.transverseProcesses ? Number(record.transverseProcesses) : score,
      eyeMuscle: record.eyeMuscle ? Number(record.eyeMuscle) : score,
      fatCover: record.fatCover ? Number(record.fatCover) : score,
      tailDock: record.tailDock ? Number(record.tailDock) : score,
      date: record.date,
      dateStr: new Date(record.date).toLocaleDateString("fr-FR"),
      evaluator: record.evaluator,
      notes: record.notes,
      nutritionalRecommendation: record.nutritionalRecommendation,
      category,
    },
  };
}

export async function getHerdBcsSummary() {
  const allRecords = await listAllBcsRecords({});

  // Group latest record per animal
  const latestByAnimalMap = new Map<number, typeof allRecords[0]>();
  for (const r of allRecords) {
    if (!latestByAnimalMap.has(r.animalId)) {
      latestByAnimalMap.set(r.animalId, r);
    }
  }

  const latestList = Array.from(latestByAnimalMap.values());
  const totalEvaluated = latestList.length;

  let sumScore = 0;
  const distribution = {
    THIN: 0,
    MODERATE: 0,
    IDEAL: 0,
    HEAVY: 0,
    OBESE: 0,
  };

  const attentionList: Array<{
    animalId: number;
    animalName: string;
    animalOfficialId: string;
    bcsScore: number;
    category: BcsCategoryInfo;
    date: string;
  }> = [];

  for (const r of latestList) {
    const score = Number(r.bcsScore);
    sumScore += score;
    const category = classifyBcsScore(score);
    distribution[category.code]++;

    if (category.code === "THIN" || category.code === "OBESE") {
      attentionList.push({
        animalId: r.animalId,
        animalName: r.animalName ?? `Animal #${r.animalId}`,
        animalOfficialId: r.animalRfid ?? "",
        bcsScore: score,
        category,
        date: r.date as unknown as string,
      });
    }
  }

  const averageScore = totalEvaluated > 0 ? Number((sumScore / totalEvaluated).toFixed(2)) : 0;
  const globalCategory = classifyBcsScore(averageScore);

  return {
    success: true as const,
    status: 200 as const,
    totalEvaluated,
    averageScore,
    globalCategory,
    distribution,
    attentionList,
  };
}
