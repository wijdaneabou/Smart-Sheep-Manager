import {
  createSensorData as createSensorDataInDb,
  getLatestSensorData as getLatestSensorDataInDb,
  getHistoricalSensorData as getHistoricalSensorDataInDb,
  getLatestForAllShields as getLatestForAllShieldsInDb,
  getLatestSensorDataForExploitationIds,
  findSensorDataById,
} from "../repositories/iotSensorData.repository.js";
import { findIotShieldById } from "../repositories/iotShields.repository.js";
import { listShieldSensors } from "../repositories/iotShields.repository.js";
import { upsertShieldStatus, findLatestByExploitation } from "../repositories/iotShieldStatus.repository.js";
import { evaluateSensorDataForAlerts } from "./iotAlerts.service.js";
import { getUserExploitationIdsWithAdmin } from "../utils/userHelpers.js";
import { db } from "../db/connection.js";
import { eq, and, count, inArray, sql } from "drizzle-orm";
import { iotAlerts } from "../db/schema/iotAlerts.js";

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

export type LatestAllShieldData = {
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

export type GetLatestAllResult =
  | { success: true; status: 200; data: LatestAllShieldData[] }
  | { success: false; status: 400; message: string };

export async function getLatestAllByExploitation(
  user: any
): Promise<GetLatestAllResult> {
  const exploitationIds = await getUserExploitationIdsWithAdmin(user);

  if (exploitationIds !== null && exploitationIds.length === 0) {
    return { success: true, status: 200, data: [] };
  }

  const rows = await findLatestByExploitation(exploitationIds);

  const shieldIds = rows.map((r) => r.shieldId);
  let alertCountByShield = new Map<number, number>();
  if (shieldIds.length > 0) {
    const conditions = [eq(iotAlerts.resolved, 0)];
    if (exploitationIds && exploitationIds.length > 0) {
      conditions.push(inArray(iotAlerts.exploitationId, exploitationIds));
    }
    if (shieldIds.length === 1) {
      conditions.push(eq(iotAlerts.shieldId, shieldIds[0]));
    } else {
      conditions.push(inArray(iotAlerts.shieldId, shieldIds));
    }

    const alertRows = await db
      .select({ shieldId: iotAlerts.shieldId, count: sql<number>`count(*)` })
      .from(iotAlerts)
      .where(and(...conditions))
      .groupBy(iotAlerts.shieldId);

    alertCountByShield = new Map(alertRows.map((r) => [r.shieldId, Number(r.count)]));
  }

  const shieldsWithSensors = await Promise.all(
    rows.map(async (row) => ({
      id: row.shieldId,
      shieldId: row.shieldId,
      temperature: row.temperature,
      activity: row.activity,
      latitude: row.latitude,
      longitude: row.longitude,
      measuredAt: row.measuredAt.toISOString(),
      createdAt: row.measuredAt.toISOString(),
      unresolvedAlertCount: alertCountByShield.get(row.shieldId) ?? 0,
      shield: {
        id: row.shield.id,
        ssmIotNumber: row.shield.ssmIotNumber,
        sensors: await listShieldSensors(row.shield.id),
        battery: row.shield.battery,
        status: row.shield.status,
        animalId: row.shield.animalId,
      },
    }))
  );

  return {
    success: true,
    status: 200,
    data: shieldsWithSensors,
  };
}

// ── GET HISTORICAL DATA ──

export type HistoricalSensorData = {
  id: number;
  shieldId: number;
  temperature: string | null;
  activity: "REST" | "MOVEMENT" | "GRAZING" | null;
  latitude: string | null;
  longitude: string | null;
  measuredAt: string;
  createdAt: string;
};

export type GetHistoricalResult =
  | { success: true; status: 200; data: HistoricalSensorData[] }
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
      measuredAt: row.measuredAt.toISOString(),
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
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