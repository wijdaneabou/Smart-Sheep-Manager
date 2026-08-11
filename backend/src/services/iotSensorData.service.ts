import {
  createSensorData as createSensorDataInDb,
  getLatestSensorData as getLatestSensorDataInDb,
  getHistoricalSensorData as getHistoricalSensorDataInDb,
  getLatestForAllShields as getLatestForAllShieldsInDb,
  getLatestSensorDataForExploitation as getLatestSensorDataForExploitationInDb,
  findSensorDataById,
} from "../repositories/iotSensorData.repository.js";
import { findIotShieldById } from "../repositories/iotShields.repository.js";
import { upsertShieldStatus, findLatestByExploitation } from "../repositories/iotShieldStatus.repository.js";
import { evaluateSensorDataForAlerts } from "./iotAlerts.service.js";
import { db } from "../db/connection.js";
import { iotSensorData } from "../db/schema/iotSensorData.js";
import { iotShields } from "../db/schema/iotShields.js";
import { animals } from "../db/schema/animals.js";
import { exploitations } from "../db/schema/exploitations.js";
import { eq, desc, and, sql, max } from "drizzle-orm";

type SensorRow = NonNullable<Awaited<ReturnType<typeof findSensorDataById>>>;

function serializeSensorData(row: SensorRow) {
  return {
    id: row.id,
    shieldId: row.shieldId,
    temperature: row.temperature,
    activity: row.activity,
    latitude: row.latitude,
    longitude: row.longitude,
    measuredAt: row.measuredAt,
    createdAt: row.createdAt,
    shield: row.shield
      ? {
          id: row.shield.id,
          ssmIotNumber: row.shield.ssmIotNumber,
          sensorType: row.shield.sensorType,
          battery: row.shield.battery,
          status: row.shield.status,
        }
      : null,
  };
}

export type SerializedSensorData = ReturnType<typeof serializeSensorData>;

export type CreateSensorDataResult =
  | { success: true; status: 201; data: SerializedSensorData }
  | { success: false; status: 400; message: string };

export async function createSensorData(input: {
  shieldId: number;
  temperature?: number | null;
  activity?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  measuredAt?: Date;
}): Promise<CreateSensorDataResult> {
  // Vérifier que le bouclier existe
  const shield = await findIotShieldById(input.shieldId);
  if (!shield) {
    return {
      success: false,
      status: 400,
      message: "Bouclier IoT introuvable.",
    };
  }

  // Vérifier que le bouclier est actif
  if (shield.status !== "ACTIVE") {
    return {
      success: false,
      status: 400,
      message: "Le bouclier IoT est inactif.",
    };
  }

  const row = await createSensorDataInDb({
    shieldId: input.shieldId,
    temperature: input.temperature !== undefined && input.temperature !== null
      ? String(input.temperature)
      : undefined,
    activity: input.activity as any,
    latitude: input.latitude !== undefined && input.latitude !== null
      ? String(input.latitude)
      : undefined,
    longitude: input.longitude !== undefined && input.longitude !== null
      ? String(input.longitude)
      : undefined,
    measuredAt: input.measuredAt ?? new Date(),
  });

  if (!row) {
    return { success: false, status: 400, message: "Erreur lors de l'enregistrement." };
  }

  // Met à jour l'état courant (une seule ligne par bouclier, pour le
  // suivi en temps réel US-4.2) — évite de reparcourir tout l'historique
  // à chaque poll du frontend, quel que soit le volume de iot_sensor_data.
  try {
    await upsertShieldStatus({
      shieldId: input.shieldId,
      temperature: row.temperature ?? undefined,
      activity: row.activity ?? undefined,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      measuredAt: row.measuredAt,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut courant :", error);
  }

  // Évaluer les alertes automatiques (US-4.3)
  try {
    await evaluateSensorDataForAlerts(row.id);
  } catch (error) {
    console.error("Erreur lors de l'évaluation des alertes :", error);
  }

  return { success: true, status: 201, data: serializeSensorData(row) };
}

export type GetLatestResult =
  | { success: true; status: 200; data: SerializedSensorData | null }
  | { success: false; status: 404; message: string };

export async function getLatestSensorData(
  shieldId: number
): Promise<GetLatestResult> {
  const shield = await findIotShieldById(shieldId);
  if (!shield) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  const row = await getLatestSensorDataInDb(shieldId);
  if (!row) {
    return { success: true, status: 200, data: null };
  }

  return { success: true, status: 200, data: serializeSensorData(row) };
}

/**
 * Récupère la dernière mesure pour chaque bouclier d'une exploitation.
 * Version compatible avec MariaDB (sans LATERAL).
 */
export type GetLatestAllResult =
  | { success: true; status: 200; data: any[] }
  | { success: false; status: 400; message: string };

export async function getLatestForAllShields(
  exploitationId?: number
): Promise<GetLatestAllResult> {
  const rows = await getLatestForAllShieldsInDb(exploitationId);
  return {
    success: true,
    status: 200,
    data: rows.map((row) => ({
      id: row.id,
      shieldId: row.shieldId,
      temperature: row.temperature,
      activity: row.activity,
      latitude: row.latitude,
      longitude: row.longitude,
      measuredAt: row.measuredAt,
      createdAt: row.createdAt,
      shield: row.shield,
    })),
  };
}

/**
 * Récupère l'état courant de chaque bouclier d'une exploitation, via la
 * table iot_shield_status (une seule ligne par bouclier, mise à jour en
 * continu). Beaucoup plus léger que de scanner tout iot_sensor_data,
 * quel que soit le nombre de mesures historiques accumulées.
 */
export async function getLatestAllByExploitation(
  exploitationId: number
): Promise<GetLatestAllResult> {
  if (!exploitationId) {
    return { success: false, status: 400, message: "exploitationId requis." };
  }

  const rows = await findLatestByExploitation(exploitationId);

  return {
    success: true,
    status: 200,
    data: rows.map((row) => ({
      id: row.shieldId, // pas d'id auto-incrémenté dans iot_shield_status : shieldId sert de clé stable
      shieldId: row.shieldId,
      temperature: row.temperature,
      activity: row.activity,
      latitude: row.latitude,
      longitude: row.longitude,
      measuredAt: row.measuredAt,
      createdAt: row.measuredAt,
      shield: {
        id: row.shield.id,
        ssmIotNumber: row.shield.ssmIotNumber,
        sensorType: row.shield.sensorType,
        battery: row.shield.battery,
        status: row.shield.status,
        animalId: row.shield.animalId,
      },
    })),
  };
}

export type GetHistoricalResult =
  | { success: true; status: 200; data: any[] }
  | { success: false; status: 404; message: string };

export async function getHistoricalSensorData(params: {
  shieldId: number;
  limit: number;
  since?: Date;
}): Promise<GetHistoricalResult> {
  const shield = await findIotShieldById(params.shieldId);
  if (!shield) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  const rows = await getHistoricalSensorDataInDb(params);
  return {
    success: true,
    status: 200,
    data: rows.map((row) => ({
      id: row.id,
      shieldId: row.shieldId,
      temperature: row.temperature,
      activity: row.activity,
      latitude: row.latitude,
      longitude: row.longitude,
      measuredAt: row.measuredAt,
      createdAt: row.createdAt,
    })),
  };
}

export type GetExploitationLatestResult =
  | { success: true; status: 200; data: any[] }
  | { success: false; status: 400; message: string };

export async function getLatestSensorDataForExploitation(
  exploitationId: number
): Promise<GetExploitationLatestResult> {
  const rows = await getLatestSensorDataForExploitationInDb(exploitationId);
  return {
    success: true,
    status: 200,
    data: rows.map((row) => ({
      id: row.id,
      shieldId: row.shieldId,
      temperature: row.temperature,
      activity: row.activity,
      latitude: row.latitude,
      longitude: row.longitude,
      measuredAt: row.measuredAt,
      createdAt: row.createdAt,
      shield: row.shield,
    })),
  };
}