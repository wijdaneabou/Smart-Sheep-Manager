import { db } from "../db/connection.js";
import { iotSensorData } from "../db/schema/iotSensorData.js";
import { iotShields } from "../db/schema/iotShields.js";
import { animals } from "../db/schema/animals.js";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm"; // added inArray

type CreateSensorData = typeof iotSensorData.$inferInsert;

export async function createSensorData(data: CreateSensorData) {
  const [result] = await db
    .insert(iotSensorData)
    .values({
      ...data,
      measuredAt: data.measuredAt ?? new Date(),
    })
    .$returningId();
  return findSensorDataById(result.id);
}

/**
 * Get a single reading by id, with its shield.
 * Uses explicit joins (not db.query...with) — MariaDB does not support
 * the LATERAL joins Drizzle's relational API generates for `with`.
 */
export async function findSensorDataById(id: number) {
  const rows = await db
    .select({
      id: iotSensorData.id,
      shieldId: iotSensorData.shieldId,
      temperature: iotSensorData.temperature,
      activity: iotSensorData.activity,
      latitude: iotSensorData.latitude,
      longitude: iotSensorData.longitude,
      measuredAt: iotSensorData.measuredAt,
      createdAt: iotSensorData.createdAt,
      shield: {
        id: iotShields.id,
        ssmIotNumber: iotShields.ssmIotNumber,
        sensorType: iotShields.sensorType,
        battery: iotShields.battery,
        status: iotShields.status,
      },
    })
    .from(iotSensorData)
    .innerJoin(iotShields, eq(iotSensorData.shieldId, iotShields.id))
    .where(eq(iotSensorData.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Get the latest sensor data reading for a given shield, including
 * the shield's associated animal. Explicit joins — same MariaDB reason.
 */
export async function getLatestSensorData(shieldId: number) {
  const rows = await db
    .select({
      id: iotSensorData.id,
      shieldId: iotSensorData.shieldId,
      temperature: iotSensorData.temperature,
      activity: iotSensorData.activity,
      latitude: iotSensorData.latitude,
      longitude: iotSensorData.longitude,
      measuredAt: iotSensorData.measuredAt,
      createdAt: iotSensorData.createdAt,
      shield: {
        id: iotShields.id,
        ssmIotNumber: iotShields.ssmIotNumber,
        sensorType: iotShields.sensorType,
        battery: iotShields.battery,
        status: iotShields.status,
        animalId: iotShields.animalId,
      },
      animal: {
        id: animals.id,
        rfid: animals.rfid,
        name: animals.name,
        breed: animals.breed,
        sex: animals.sex,
      },
    })
    .from(iotSensorData)
    .innerJoin(iotShields, eq(iotSensorData.shieldId, iotShields.id))
    .leftJoin(animals, eq(iotShields.animalId, animals.id))
    .where(eq(iotSensorData.shieldId, shieldId))
    .orderBy(desc(iotSensorData.measuredAt))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * 🟢 MODIFIED: Get the latest sensor data for ALL shields belonging to
 * one or more exploitations. Joins with iot_shields to filter by exploitation.
 * If exploitationIds is null or empty, no filter (admin).
 */
export async function getLatestSensorDataForExploitationIds(
  exploitationIds: number[] | null
) {
  const conditions = [];
  if (exploitationIds && exploitationIds.length > 0) {
    conditions.push(inArray(iotShields.exploitationId, exploitationIds));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const result = await db
    .select({
      id: iotSensorData.id,
      shieldId: iotSensorData.shieldId,
      temperature: iotSensorData.temperature,
      activity: iotSensorData.activity,
      latitude: iotSensorData.latitude,
      longitude: iotSensorData.longitude,
      measuredAt: iotSensorData.measuredAt,
      createdAt: iotSensorData.createdAt,
      shield: {
        id: iotShields.id,
        ssmIotNumber: iotShields.ssmIotNumber,
        sensorType: iotShields.sensorType,
        battery: iotShields.battery,
        status: iotShields.status,
        animalId: iotShields.animalId,
      },
    })
    .from(iotSensorData)
    .innerJoin(iotShields, eq(iotSensorData.shieldId, iotShields.id))
    .where(whereClause)
    .orderBy(desc(iotSensorData.measuredAt))
    .limit(100);

  return result;
}

/**
 * 🟢 MODIFIED: Get historical sensor data for a shield,
 * optionally filtered by a "since" date.
 * (No change here – individual shield access controlled by service.)
 */
export async function getHistoricalSensorData(params: {
  shieldId: number;
  limit: number;
  since?: Date;
}) {
  const conditions = [eq(iotSensorData.shieldId, params.shieldId)];

  if (params.since) {
    conditions.push(gte(iotSensorData.measuredAt, params.since));
  }

  const rows = await db
    .select()
    .from(iotSensorData)
    .where(and(...conditions))
    .orderBy(desc(iotSensorData.measuredAt))
    .limit(params.limit);

  return rows;
}

/**
 * 🟢 MODIFIED: Get the latest sensor data for all shields,
 * optionally filtered by one or more exploitations.
 * Uses a CTE (WITH) to get only the most recent reading per shield.
 * Now accepts exploitationIds array instead of single ID.
 */
export async function getLatestForAllShields(exploitationIds?: number[] | null) {
  const latestSubquery = db
    .$with("latest_readings")
    .as(
      db
        .select({
          shieldId: iotSensorData.shieldId,
          latestId: sql<number>`MAX(${iotSensorData.id})`.as("latest_id"),
        })
        .from(iotSensorData)
        .groupBy(iotSensorData.shieldId)
    );

  // Construire la condition AVANT d'appeler .where()
  const conditions = [];
  if (exploitationIds && exploitationIds.length > 0) {
    conditions.push(inArray(iotShields.exploitationId, exploitationIds));
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;

  return db
    .with(latestSubquery)
    .select({
      id: iotSensorData.id,
      shieldId: iotSensorData.shieldId,
      temperature: iotSensorData.temperature,
      activity: iotSensorData.activity,
      latitude: iotSensorData.latitude,
      longitude: iotSensorData.longitude,
      measuredAt: iotSensorData.measuredAt,
      createdAt: iotSensorData.createdAt,
      shield: {
        id: iotShields.id,
        ssmIotNumber: iotShields.ssmIotNumber,
        sensorType: iotShields.sensorType,
        battery: iotShields.battery,
        status: iotShields.status,
        animalId: iotShields.animalId,
      },
    })
    .from(iotSensorData)
    .innerJoin(iotShields, eq(iotSensorData.shieldId, iotShields.id))
    .innerJoin(latestSubquery, eq(iotSensorData.id, latestSubquery.latestId))
    .where(whereClause);
}