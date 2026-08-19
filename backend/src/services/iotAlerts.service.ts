import {
  createAlert as createAlertInDb,
  findAlertById,
  listAlertsByExploitationIds,
  resolveAlert as resolveAlertInDb,
  hasUnresolvedAlert,
  listUnresolvedAlertsByShield,
  countUnresolvedAlertsByExploitationIds,
} from "../repositories/iotAlerts.repository.js";
import { isPointInsideAnyZone } from "./iotZones.service.js";
import { findIotShieldById } from "../repositories/iotShields.repository.js";
import { findExploitationById } from "../repositories/exploitations.repository.js";
import { getUserExploitationIdsWithAdmin } from "../utils/userHelpers.js";
import { db } from "../db/connection.js";
import { iotSensorData } from "../db/schema/iotSensorData.js";
import { eq, and, desc, asc, ne, gte } from "drizzle-orm";

// ── Alert thresholds ──────────────────────────────────────────────
export const ALERT_THRESHOLDS = {
  HIGH_TEMPERATURE: 40.5,
  INACTIVITY_MINUTES: 120,
  LOW_BATTERY: 15,
  GRAZING_RADIUS_KM: 5,
} as const;

export type AlertType =
  | "HIGH_TEMPERATURE"
  | "INACTIVITY"
  | "LOW_BATTERY"
  | "OUT_OF_ZONE";

export type AlertSeverity = "WARNING" | "CRITICAL";

export interface SerializedAlert {
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
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  shield?: {
    id: number;
    ssmIotNumber: string;
    sensorType: string;
    battery: string;
    status: string;
    animalId: number | null;
    exploitationId: number | null;
  } | null;
  animal?: {
    id: number;
    rfid: string;
    name: string;
    breed: string;
    sex: string;
  } | null;
  exploitation?: {
    id: number;
    name: string;
    latitude: string | null;
    longitude: string | null;
  } | null;
}

function serializeAlert(row: any): SerializedAlert {
  return {
    id: row.id,
    shieldId: row.shieldId,
    animalId: row.animalId,
    exploitationId: row.exploitationId,
    type: row.type,
    severity: row.severity,
    message: row.message,
    value: row.value,
    threshold: row.threshold,
    resolved: Boolean(row.resolved),
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    shield: row.shield ? {
      id: row.shield.id,
      ssmIotNumber: row.shield.ssmIotNumber,
      sensorType: row.shield.sensorType,
      battery: row.shield.battery,
      status: row.shield.status,
      animalId: row.shield.animalId,
      exploitationId: row.shield.exploitationId,
    } : null,
    animal: row.animal ? {
      id: row.animal.id,
      rfid: row.animal.rfid,
      name: row.animal.name,
      breed: row.animal.breed,
      sex: row.animal.sex,
    } : null,
    exploitation: row.exploitation ? {
      id: row.exploitation.id,
      name: row.exploitation.name,
      latitude: row.exploitation.latitude,
      longitude: row.exploitation.longitude,
    } : null,
  };
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Helper: check if alert belongs to user's exploitations ──

async function alertBelongsToUser(alertId: number, user: any): Promise<boolean> {
  const alert = await findAlertById(alertId);
  if (!alert) return false;
  if (user.roleName?.toLowerCase() === 'admin') return true;
  const userExploitationIds = await getUserExploitationIdsWithAdmin(user);
  if (!userExploitationIds || userExploitationIds.length === 0) return false;
  return userExploitationIds.includes(alert.exploitationId!);
}

// ── Core alert detection ──────────────────────────────────────────

export async function evaluateSensorDataForAlerts(sensorDataId: number) {
  const rows = await db
    .select()
    .from(iotSensorData)
    .where(eq(iotSensorData.id, sensorDataId))
    .limit(1);
  const sensorData = rows[0];
  if (!sensorData) return;

  const shield = await findIotShieldById(sensorData.shieldId);
  if (!shield) return;

  const animal = shield.animal;
  const exploitationId = shield.exploitationId ?? undefined;
  const exploitation = exploitationId
    ? await findExploitationById(exploitationId)
    : null;

  const alertsToCreate: Array<{
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    value: string;
    threshold: string;
  }> = [];

  // 1. High temperature
  if (sensorData.temperature) {
    const temp = parseFloat(sensorData.temperature);
    if (temp > ALERT_THRESHOLDS.HIGH_TEMPERATURE) {
      const already = await hasUnresolvedAlert(shield.id, "HIGH_TEMPERATURE");
      if (!already) {
        alertsToCreate.push({
          type: "HIGH_TEMPERATURE",
          severity: "CRITICAL",
          message: `Température élevée : ${temp.toFixed(1)}°C (seuil ${ALERT_THRESHOLDS.HIGH_TEMPERATURE}°C). Animal ${animal?.name ?? shield.ssmIotNumber}.`,
          value: temp.toFixed(2),
          threshold: String(ALERT_THRESHOLDS.HIGH_TEMPERATURE),
        });
      }
    }
  }

  // 2. Low battery
  if (shield.battery) {
    const battery = parseFloat(shield.battery);
    if (battery < ALERT_THRESHOLDS.LOW_BATTERY) {
      const already = await hasUnresolvedAlert(shield.id, "LOW_BATTERY");
      if (!already) {
        alertsToCreate.push({
          type: "LOW_BATTERY",
          severity: "WARNING",
          message: `Batterie faible : ${battery.toFixed(0)}% (seuil ${ALERT_THRESHOLDS.LOW_BATTERY}%). Bouclier ${shield.ssmIotNumber}.`,
          value: battery.toFixed(2),
          threshold: String(ALERT_THRESHOLDS.LOW_BATTERY),
        });
      }
    }
  }

  // 3. Inactivity > 2h
  if (sensorData.activity === "REST" && animal) {
    const inactivityThreshold = new Date(
      new Date(sensorData.measuredAt).getTime() - ALERT_THRESHOLDS.INACTIVITY_MINUTES * 60 * 1000
    );

    const recentActive = await db.query.iotSensorData.findFirst({
      where: and(
        eq(iotSensorData.shieldId, shield.id),
        ne(iotSensorData.activity, "REST"),
        gte(iotSensorData.measuredAt, inactivityThreshold)
      ),
      orderBy: desc(iotSensorData.measuredAt),
    });

    if (!recentActive) {
      const already = await hasUnresolvedAlert(shield.id, "INACTIVITY");
      if (!already) {
        alertsToCreate.push({
          type: "INACTIVITY",
          severity: "WARNING",
          message: `Immobilité prolongée : ${animal.name} inactif depuis > ${ALERT_THRESHOLDS.INACTIVITY_MINUTES / 60}h.`,
          value: `> ${ALERT_THRESHOLDS.INACTIVITY_MINUTES} min`,
          threshold: `${ALERT_THRESHOLDS.INACTIVITY_MINUTES} min`,
        });
      }
    }
  }

  // 4. Out of zone
  if (sensorData.latitude && sensorData.longitude && exploitationId) {
    const lat = parseFloat(sensorData.latitude);
    const lng = parseFloat(sensorData.longitude);

    const { insideZone, hasZonesDefined } = await isPointInsideAnyZone(
      exploitationId,
      lat,
      lng
    );

    if (hasZonesDefined && !insideZone) {
      const already = await hasUnresolvedAlert(shield.id, "OUT_OF_ZONE");
      if (!already) {
        alertsToCreate.push({
          type: "OUT_OF_ZONE",
          severity: "WARNING",
          message: `Sortie de zone : ${animal?.name ?? shield.ssmIotNumber} est en dehors de toutes les zones de pâturage définies.`,
          value: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          threshold: "zone(s) définie(s)",
        });
      }
    } else if (insideZone) {
      const already = await hasUnresolvedAlert(shield.id, "OUT_OF_ZONE");
      if (already) {
        const zoneAlert = await listUnresolvedAlertsByShield(shield.id);
        const outOfZoneAlert = zoneAlert.find((a) => a.type === "OUT_OF_ZONE");
        if (outOfZoneAlert) {
          await resolveAlertInDb(outOfZoneAlert.id);
        }
      }
    }
  }

  for (const alert of alertsToCreate) {
    await createAlertInDb({
      shieldId: shield.id,
      animalId: animal?.id ?? null,
      exploitationId: exploitationId ?? null,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold,
      resolved: 0,
    });
  }
}

// ── Public API ────────────────────────────────────────────────────

export type ListAlertsResult =
  | { success: true; status: 200; alerts: SerializedAlert[]; total: number }
  | { success: false; status: 400; message: string };

export async function listAlerts(
  user: any,
  params: {
    resolved?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ListAlertsResult> {
  const exploitationIds = await getUserExploitationIdsWithAdmin(user);

  // ✅ Early return if no exploitations
  if (exploitationIds !== null && exploitationIds.length === 0) {
    return { success: true, status: 200, alerts: [], total: 0 };
  }

  const { rows, total } = await listAlertsByExploitationIds(
    exploitationIds,
    {
      resolved: params.resolved,
      type: params.type,
      limit: params.limit,
      offset: params.offset,
    }
  );

  return {
    success: true,
    status: 200,
    alerts: rows.map(serializeAlert),
    total,
  };
}

export type GetAlertResult =
  | { success: true; status: 200; alert: SerializedAlert }
  | { success: false; status: 403; message: string }
  | { success: false; status: 404; message: string };

export async function getAlertById(id: number, user: any): Promise<GetAlertResult> {
  if (!(await alertBelongsToUser(id, user))) {
    return { success: false, status: 403, message: "Accès interdit à cette alerte." };
  }
  const alert = await findAlertById(id);
  if (!alert) {
    return { success: false, status: 404, message: "Alerte introuvable." };
  }
  return { success: true, status: 200, alert: serializeAlert(alert) };
}

export type ResolveAlertResult =
  | { success: true; status: 200; alert: SerializedAlert }
  | { success: false; status: 403; message: string }
  | { success: false; status: 404; message: string };

export async function resolveAlert(id: number, user: any): Promise<ResolveAlertResult> {
  if (!(await alertBelongsToUser(id, user))) {
    return { success: false, status: 403, message: "Accès interdit à cette alerte." };
  }
  const existing = await findAlertById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Alerte introuvable." };
  }
  const resolved = await resolveAlertInDb(id);
  if (!resolved) {
    return { success: false, status: 404, message: "Alerte introuvable." };
  }
  return { success: true, status: 200, alert: serializeAlert(resolved) };
}

export type AlertSummaryResult =
  | { success: true; status: 200; summary: Record<string, number> }
  | { success: false; status: 400; message: string };

export async function getAlertSummary(user: any): Promise<AlertSummaryResult> {
  const exploitationIds = await getUserExploitationIdsWithAdmin(user);

  // ✅ Early return if no exploitations
  if (exploitationIds !== null && exploitationIds.length === 0) {
    return { success: true, status: 200, summary: {} };
  }

  const counts = await countUnresolvedAlertsByExploitationIds(exploitationIds);
  const summary: Record<string, number> = {};
  for (const row of counts) {
    summary[row.type] = Number(row.count);
  }
  return { success: true, status: 200, summary };
}