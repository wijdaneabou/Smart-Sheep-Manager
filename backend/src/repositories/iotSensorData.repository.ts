import { db } from "../db/connection.js";
import { iotSensorData } from "../db/schema/iotSensorData.js";
import { iotShields } from "../db/schema/iotShields.js";
import { animals } from "../db/schema/animals.js";
import { eq, desc, and, gte, sql } from "drizzle-orm";

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
 * Get the latest sensor data for ALL shields belonging to an exploitation.
 */
export async function getLatestSensorDataForExploitation(exploitationId: number) {
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
    .where(eq(iotShields.exploitationId, exploitationId))
    .orderBy(desc(iotSensorData.measuredAt))
    .limit(100);

  return result;
}

/**
 * Get historical sensor data for a shield, optionally filtered by a "since" date.
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
 * Get the latest sensor data for all shields (optionally filtered by exploitation).
 * Uses a CTE (WITH) to get only the most recent reading per shield — CTEs are
 * supported by MariaDB 10.2+, unlike Drizzle's `with:` relational LATERAL joins.
 */
export async function getLatestForAllShields(exploitationId?: number) {
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

  // Construire la condition AVANT d'appeler .where(), pour ne jamais perdre le filtre
  const whereClause = exploitationId
    ? eq(iotShields.exploitationId, exploitationId)
    : undefined;

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