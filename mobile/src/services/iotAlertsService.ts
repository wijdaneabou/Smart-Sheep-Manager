import api from "./api";

export type AlertType = "HIGH_TEMPERATURE" | "INACTIVITY" | "LOW_BATTERY" | "OUT_OF_ZONE";
export type AlertSeverity = "WARNING" | "CRITICAL";

export type IotAlert = {
  id: number;
  shieldId: number;
  animalId: number | null;
  exploitationId: number | null;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value: string | null;
  threshold: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  shield?: { id: number; ssmIotNumber: string } | null;
  animal?: { id: number; name: string; rfid: string } | null;
};

function extractError(err: any): string {
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

export async function listAlerts(params: {
  exploitationId: number;
  resolved?: boolean;
  type?: AlertType;
}) {
  try {
    const response = await api.get<{ data: IotAlert[]; total: number }>(
      "/iot-alerts",
      { params }
    );
    return { success: true as const, data: response.data.data, total: response.data.total };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getAlertSummary(exploitationId: number) {
  try {
    const response = await api.get<{ data: Record<string, number> }>(
      "/iot-alerts/summary",
      { params: { exploitationId } }
    );
    return { success: true as const, summary: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function resolveAlert(id: number) {
  try {
    const response = await api.patch<{ data: IotAlert }>(`/iot-alerts/${id}/resolve`);
    return { success: true as const, alert: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}