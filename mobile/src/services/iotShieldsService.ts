import api from "./api";

export type SensorType =
  | "LOCALIZATION"
  | "TEMPERATURE"
  | "ACTIVITY"
  | "FEEDING"
  | "WATER_INTAKE"
  | "HEART_RATE";

export type ShieldStatus = "ACTIVE" | "INACTIVE";

export type ShieldAnimal = {
  id: number;
  rfid: string;
  name: string;
  breed: string;
  sex: string;
};

export type ShieldExploitation = {
  id: number;
  name: string;
};

export type IotShield = {
  id: number;
  ssmIotNumber: string;
  apiKey: string;
  sensorType: SensorType;
  battery: string;
  animalId: number | null;
  animal: ShieldAnimal | null;
  status: ShieldStatus;
  exploitationId: number | null;
  exploitation: ShieldExploitation | null;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

function extractError(err: any): string {
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

export async function listIotShields(params: {
  exploitationId?: number;
  page?: number;
  limit?: number;
  search?: string;
  sensorType?: SensorType;
  status?: ShieldStatus;
} = {}) {
  try {
    const response = await api.get<{
      data: IotShield[];
      pagination: Pagination;
    }>("/iot-shields", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getIotShieldById(id: number) {
  try {
    const response = await api.get<{ data: IotShield }>(`/iot-shields/${id}`);
    return { success: true as const, shield: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createIotShield(input: {
  ssmIotNumber: string;
  sensorType: SensorType;
  battery?: number;
  animalId?: number | null;
  status?: ShieldStatus;
  exploitationId?: number | null;
}) {
  try {
    const response = await api.post<{ data: IotShield }>("/iot-shields", input);
    return { success: true as const, shield: response.data.data };
  } catch (err: any) {
    console.log("STATUS =", err?.response?.status);
    console.log("DATA =", err?.response?.data);
    console.log("ERROR =", err);

    return {
      success: false as const,
      message:
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "Impossible de contacter le serveur.",
    };
  }
}

export async function updateIotShield(
  id: number,
  input: Partial<{
    ssmIotNumber: string;
    sensorType: SensorType;
    battery: number | null;
    animalId: number | null;
    status: ShieldStatus;
    exploitationId: number | null;
  }>
) {
  try {
    const response = await api.put<{ data: IotShield }>(`/iot-shields/${id}`, input);
    return { success: true as const, shield: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function deleteIotShield(id: number) {
  try {
    await api.delete(`/iot-shields/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Associate (or dissociate) an animal with an IoT shield.
 * Pass null to dissociate.
 */
export async function associateAnimalToShield(
  shieldId: number,
  animalId: number | null
) {
  try {
    const response = await api.patch<{ data: IotShield }>(
      `/iot-shields/${shieldId}/associate`,
      { animalId }
    );
    return { success: true as const, shield: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Update the battery level of a shield.
 */
export async function updateBatteryLevel(shieldId: number, battery: number) {
  try {
    const response = await api.patch<{ data: IotShield }>(
      `/iot-shields/${shieldId}/battery`,
      { battery }
    );
    return { success: true as const, shield: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Toggle the active/inactive status of a shield.
 */
export async function toggleShieldStatus(shieldId: number) {
  try {
    const response = await api.patch<{ data: IotShield }>(
      `/iot-shields/${shieldId}/toggle-status`
    );
    return { success: true as const, shield: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}