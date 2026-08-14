import api from "./api";

export type ZonePoint = { lat: number; lng: number };

export type IotZone = {
  id: number;
  exploitationId: number;
  name: string;
  color: string | null;
  polygon: ZonePoint[];
  createdAt: string;
  updatedAt: string;
};

function extractError(err: any): string {
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

/**
 * ✅ Updated: exploitationId removed from params.
 * Backend now filters based on authenticated user's exploitations.
 */
export async function listZones() {
  try {
    const response = await api.get<{ data: IotZone[] }>("/iot-zones");
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * ✅ Updated: exploitationId is optional; backend will validate or use user's first exploitation.
 */
export async function createZone(input: {
  exploitationId?: number; // optional, backend will validate
  name: string;
  color?: string;
  polygon: ZonePoint[];
}) {
  try {
    const response = await api.post<{ data: IotZone }>("/iot-zones", input);
    return { success: true as const, zone: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function updateZone(
  id: number,
  input: Partial<{ name: string; color: string; polygon: ZonePoint[] }>
) {
  try {
    const response = await api.put<{ data: IotZone }>(`/iot-zones/${id}`, input);
    return { success: true as const, zone: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function deleteZone(id: number) {
  try {
    await api.delete(`/iot-zones/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}