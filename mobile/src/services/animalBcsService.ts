import api from "./api";

export interface BcsCategoryInfo {
  code: "THIN" | "MODERATE" | "IDEAL" | "HEAVY" | "OBESE";
  label: string;
  color: string;
  description: string;
  defaultRecommendation: string;
}

export interface BcsRecord {
  id: number;
  animalId: number;
  bcsScore: number;
  spinousProcesses: number;
  transverseProcesses: number;
  eyeMuscle: number;
  fatCover: number;
  tailDock: number;
  date: string;
  dateStr: string;
  evaluator?: string;
  notes?: string;
  nutritionalRecommendation?: string;
  category: BcsCategoryInfo;
}

export interface BcsHistoryResponse {
  animal: {
    id: number;
    name: string;
    officialId: string;
    breed: string;
    sex: string;
  };
  records: BcsRecord[];
  latestRecord: BcsRecord | null;
  trend: "UP" | "DOWN" | "STABLE" | null;
}

export interface BcsHerdSummaryResponse {
  totalEvaluated: number;
  averageScore: number;
  globalCategory: BcsCategoryInfo;
  distribution: {
    THIN: number;
    MODERATE: number;
    IDEAL: number;
    HEAVY: number;
    OBESE: number;
  };
  attentionList: Array<{
    animalId: number;
    animalName: string;
    animalOfficialId: string;
    bcsScore: number;
    category: BcsCategoryInfo;
    date: string;
  }>;
}

function extractError(err: any): string {
  // 1. Server responded with an error field (string)
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;

  // 2. Server responded with a message field
  if (err?.response?.data?.message) return err.response.data.message;

  // 3. Network-level error (server unreachable, timeout, CORS, etc.)
  if (err?.message) return `Erreur réseau : ${err.message}`;

  // 4. Fallback
  return "Impossible de contacter le serveur. Vérifiez que le backend est démarré.";
}

/**
 * Crée un nouvel enregistrement BCS pour un animal.
 */
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
  try {
    const response = await api.post<{ data: any }>(
      `/animals/${input.animalId}/bcs`,
      input
    );
    return { success: true as const, record: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Récupère l'historique BCS complet d'un animal.
 */
export async function getBcsHistory(animalId: number) {
  try {
    const response = await api.get<{ data: BcsHistoryResponse }>(
      `/animals/${animalId}/bcs`
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Récupère le dernier score BCS enregistré pour un animal.
 */
export async function getLatestBcs(animalId: number) {
  try {
    const response = await api.get<{ data: { latestRecord: BcsRecord | null } }>(
      `/animals/${animalId}/bcs/latest`
    );
    return { success: true as const, latestRecord: response.data.data.latestRecord };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Récupère le résumé BCS de l'ensemble du troupeau.
 */
export async function getHerdBcsSummary() {
  try {
    const response = await api.get<{ data: BcsHerdSummaryResponse }>(
      `/animals/bcs/summary`
    );
    return { success: true as const, summary: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
