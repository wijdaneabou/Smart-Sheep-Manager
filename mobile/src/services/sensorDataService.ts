import api from "./api";

export type SensorData = {
  id: number;
  shieldId: number;
  temperature: string | null;
  activity: "REST" | "MOVEMENT" | "GRAZING" | null;
  latitude: string | null;
  longitude: string | null;
  measuredAt: string;
  createdAt: string;
  shield: {
    id: number;
    ssmIotNumber: string;
    sensors: Array<{ id: number; sensorType: string; status: string }>;
    battery: string;
    status: string;
    animalId: number | null;
  };
};

export type LatestSensorData = {
  id: number;
  shieldId: number;
  temperature: string | null;
  activity: "REST" | "MOVEMENT" | "GRAZING" | null;
  latitude: string | null;
  longitude: string | null;
  measuredAt: string;
  createdAt: string;
  unresolvedAlertCount: number;
  shield: {
    id: number;
    ssmIotNumber: string;
    sensors: Array<{ id: number; sensorType: string; status: string }>;
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

export async function getLatestAllSensorData() {
  try {
    const response = await api.get<{ data: LatestSensorData[] }>("/sensor-data/latest");
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getLatestSensorData(shieldId: number) {
  try {
    const response = await api.get<{ data: LatestSensorData | null }>(
      `/sensor-data/latest/${shieldId}`
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getSensorHistory(shieldId: number, params?: {
  limit?: number;
  since?: string;
}) {
  try {
    const response = await api.get<{ data: SensorData[] }>(
      `/sensor-data/history/${shieldId}`,
      { params }
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
