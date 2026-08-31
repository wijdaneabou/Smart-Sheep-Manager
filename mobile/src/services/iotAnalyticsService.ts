import api from "./api";

export type TemperaturePoint = { day: string; avgTemperature: number; maxTemperature: number };
export type GrazingPoint = { day: string; grazingPercent: number; estimatedHours: number };
export type DistancePoint = { day: string; distanceKm: number };
export type AnimalComparison = {
  shieldId: number;
  animalId: number;
  animalName: string;
  animalRfid: string;
  avgTemperature: number | null;
  grazingPercent: number | null;
  distanceKm: number;
};

function extractError(err: any): string {
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

export async function getTemperatureTrend(shieldId: number, days = 7) {
  try {
    const response = await api.get<{ data: TemperaturePoint[] }>(
      `/iot-analytics/${shieldId}/temperature-trend`,
      { params: { days } }
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getGrazingTime(shieldId: number, days = 7) {
  try {
    const response = await api.get<{ data: GrazingPoint[] }>(
      `/iot-analytics/${shieldId}/grazing-time`,
      { params: { days } }
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getDistance(shieldId: number, days = 7) {
  try {
    const response = await api.get<{ data: DistancePoint[]; totalKm: number }>(
      `/iot-analytics/${shieldId}/distance`,
      { params: { days } }
    );
    return { success: true as const, data: response.data.data, totalKm: response.data.totalKm };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function compareAnimals(days = 7) {
  try {
    const response = await api.get<{ data: AnimalComparison[] }>("/iot-analytics/compare", {
      params: { days },
    });
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}