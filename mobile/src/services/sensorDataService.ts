import api from "./api";

export type ActivityType = "REST" | "MOVEMENT" | "GRAZING";

export type SensorReading = {
  id: number;
  shieldId: number;
  temperature: string | null;
  activity: ActivityType | null;
  latitude: string | null;
  longitude: string | null;
  measuredAt: string;
  createdAt: string;
  shield?: {
    id: number;
    ssmIotNumber: string;
    sensorType: string;
    battery: string;
    status: string;
    animalId: number | null;
  };
};

export type LatestSensorData = {
  id: number;
  shieldId: number;
  temperature: string | null;
  activity: ActivityType | null;
  latitude: string | null;
  longitude: string | null;
  measuredAt: string;
  createdAt: string;
  shield: {
    id: number;
    ssmIotNumber: string;
    sensorType: string;
    battery: string;
    status: string;
    animalId: number | null;
  };
};

function extractError(err: any): string {
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

/**
 * Enregistre une nouvelle mesure depuis un capteur IoT.
 */
export async function createSensorData(input: {
  shieldId: number;
  temperature?: number | null;
  activity?: ActivityType | null;
  latitude?: number | null;
  longitude?: number | null;
  measuredAt?: Date;
}) {
  try {
    const response = await api.post<{ data: SensorReading }>("/sensor-data", input);
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Dernière mesure d'un bouclier.
 */
export async function getLatestSensorData(shieldId: number) {
  try {
    const response = await api.get<{ data: SensorReading | null }>(
      `/sensor-data/latest/${shieldId}`
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Dernières mesures de tous les boucliers (optionnel: exploitationId).
 */
export async function getLatestAllSensorData(exploitationId?: number) {
  try {
    const params = exploitationId ? { exploitationId } : undefined;
    const response = await api.get<{ data: LatestSensorData[] }>(
      "/sensor-data/latest",
      { params }
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Historique des mesures d'un bouclier.
 */
export async function getHistoricalSensorData(
  shieldId: number,
  limit: number = 100,
  since?: Date
) {
  try {
    const params: Record<string, any> = { limit };
    if (since) params.since = since.toISOString();
    const response = await api.get<{ data: SensorReading[] }>(
      `/sensor-data/history/${shieldId}`,
      { params }
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Dernières mesures de tous les boucliers d'une exploitation.
 */
export async function getExploitationLatestSensorData(exploitationId: number) {
  try {
    const response = await api.get<{ data: LatestSensorData[] }>(
      `/sensor-data/exploitation/${exploitationId}/latest`
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
