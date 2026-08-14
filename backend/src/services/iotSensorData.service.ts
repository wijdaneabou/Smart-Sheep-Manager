import {
  createSensorData as createSensorDataInDb,
  getLatestSensorData as getLatestSensorDataInDb,
  getHistoricalSensorData as getHistoricalSensorDataInDb,
  getLatestForAllShields as getLatestForAllShieldsInDb,
  getLatestSensorDataForExploitationIds,
  findSensorDataById,
} from "../repositories/iotSensorData.repository.js";
import { findIotShieldById } from "../repositories/iotShields.repository.js";
import { upsertShieldStatus, findLatestByExploitation } from "../repositories/iotShieldStatus.repository.js";
import { evaluateSensorDataForAlerts } from "./iotAlerts.service.js";
import { getUserExploitationIdsWithAdmin } from "../utils/userHelpers.js";

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

// ── Helper: check if shield belongs to user's exploitations ──

async function shieldBelongsToUser(shieldId: number, user: any): Promise<boolean> {
  const shield = await findIotShieldById(shieldId);
  if (!shield) return false;
  if (user.roleName?.toLowerCase() === 'admin') return true;
  const userExploitationIds = await getUserExploitationIdsWithAdmin(user);
  if (!userExploitationIds || userExploitationIds.length === 0) return false;
  return userExploitationIds.includes(shield.exploitationId!);
}

// ── CREATE (uses API key) ──

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
  const shield = await findIotShieldById(input.shieldId);
  if (!shield) {
    return {
      success: false,
      status: 400,
      message: "Bouclier IoT introuvable.",
    };
  }

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

  try {
    await evaluateSensorDataForAlerts(row.id);
  } catch (error) {
    console.error("Erreur lors de l'évaluation des alertes :", error);
  }

  return { success: true, status: 201, data: serializeSensorData(row) };
}

// ── GET LATEST FOR A SINGLE SHIELD ──

export type GetLatestResult =
  | { success: true; status: 200; data: SerializedSensorData | null }
  | { success: false; status: 403; message: string }
  | { success: false; status: 404; message: string };

export async function getLatestSensorData(
  shieldId: number,
  user: any
): Promise<GetLatestResult> {
  const shield = await findIotShieldById(shieldId);
  if (!shield) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }
  if (!(await shieldBelongsToUser(shieldId, user))) {
    return { success: false, status: 403, message: "Accès interdit à ce bouclier." };
  }

  const row = await getLatestSensorDataInDb(shieldId);
  if (!row) {
    return { success: true, status: 200, data: null };
  }

  return { success: true, status: 200, data: serializeSensorData(row) };
}

// ── GET LATEST FOR ALL SHIELDS ──

export type GetLatestAllResult =
  | { success: true; status: 200; data: any[] }
  | { success: false; status: 400; message: string };

export async function getLatestAllByExploitation(
  user: any
): Promise<GetLatestAllResult> {
  const exploitationIds = await getUserExploitationIdsWithAdmin(user);

  // ✅ Early return if no exploitations
  if (exploitationIds !== null && exploitationIds.length === 0) {
    return { success: true, status: 200, data: [] };
  }

  const rows = await findLatestByExploitation(exploitationIds);

  return {
    success: true,
    status: 200,
    data: rows.map((row) => ({
      id: row.shieldId,
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

// ── GET HISTORICAL DATA ──

export type GetHistoricalResult =
  | { success: true; status: 200; data: any[] }
  | { success: false; status: 403; message: string }
  | { success: false; status: 404; message: string };

export async function getHistoricalSensorData(
  params: {
    shieldId: number;
    limit: number;
    since?: Date;
  },
  user: any
): Promise<GetHistoricalResult> {
  const shield = await findIotShieldById(params.shieldId);
  if (!shield) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }
  if (!(await shieldBelongsToUser(params.shieldId, user))) {
    return { success: false, status: 403, message: "Accès interdit à ce bouclier." };
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

// ── (Optional) getLatestForAllShields ── not directly used by controllers

export async function getLatestForAllShields(exploitationIds?: number[] | null) {
  const rows = await getLatestForAllShieldsInDb(exploitationIds);
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