import api from "./api";

export interface WeightRecord {
  id: number;
  animalId: number;
  weight: string;
  bcs: string | null;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface GrowthDataPoint {
  id: number;
  date: string;
  dateStr: string;
  weight: number;
  bcs: number | null;
  note: string | null;
  gmq: number | null;
}

export interface GrowthCurveData {
  animal: {
    id: number;
    name: string;
    breed: string;
    sex: string;
    birthDate: string | null;
    photoUrl: string | null;
  };
  dataPoints: GrowthDataPoint[];
  averageGmq: number;
  totalMeasurements: number;
}

function extractError(err: any): string {
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

/**
 * Crée un nouvel enregistrement de poids.
 */
export async function createWeightRecord(input: {
  animalId: number;
  weight: number;
  bcs?: number;
  date: string;
  note?: string;
}) {
  try {
    const response = await api.post<{ data: WeightRecord }>(
      `/animals/${input.animalId}/weights`,
      input
    );
    return { success: true as const, record: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Récupère la courbe de croissance avec GMQ calculé.
 */
export async function getGrowthCurve(animalId: number) {
  try {
    const response = await api.get<{ data: GrowthCurveData }>(
      `/animals/${animalId}/weights/growth`
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
