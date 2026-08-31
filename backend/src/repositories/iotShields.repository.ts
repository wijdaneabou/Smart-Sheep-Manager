import { db } from "../db/connection.js";
import { iotShields } from "../db/schema/iotShields.js";
import { iotShieldSensors } from "../db/schema/iotShieldSensors.js";
import { animals } from "../db/schema/animals.js";
import { exploitations } from "../db/schema/exploitations.js";
import { eq, and, like, desc, count, or, ne, inArray } from "drizzle-orm";

type CreateIotShieldData = typeof iotShields.$inferInsert;
type UpdateIotShieldData = Partial<CreateIotShieldData>;

export async function findIotShieldById(id: number) {
  const rows = await db
    .select({
      id: iotShields.id,
      ssmIotNumber: iotShields.ssmIotNumber,
      apiKey: iotShields.apiKey,
      battery: iotShields.battery,
      animalId: iotShields.animalId,
      status: iotShields.status,
      exploitationId: iotShields.exploitationId,
      createdAt: iotShields.createdAt,
      updatedAt: iotShields.updatedAt,
      animal: {
        id: animals.id,
        rfid: animals.rfid,
        name: animals.name,
        breed: animals.breed,
        sex: animals.sex,
      },
      exploitation: {
        id: exploitations.id,
        name: exploitations.name,
      },
    })
    .from(iotShields)
    .leftJoin(animals, eq(iotShields.animalId, animals.id))
    .leftJoin(exploitations, eq(iotShields.exploitationId, exploitations.id))
    .where(eq(iotShields.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function findIotShieldBySsmIotNumber(ssmIotNumber: string) {
  const result = await db.query.iotShields.findFirst({
    where: eq(iotShields.ssmIotNumber, ssmIotNumber),
  });
  return result ?? null;
}

export async function findIotShieldByApiKey(apiKey: string) {
  const result = await db.query.iotShields.findFirst({
    where: eq(iotShields.apiKey, apiKey),
  });
  return result ?? null;
}

export async function createIotShield(data: CreateIotShieldData) {
  const [result] = await db
    .insert(iotShields)
    .values(data)
    .$returningId();

  return findIotShieldById(result.id);
}

export async function updateIotShield(id: number, data: UpdateIotShieldData) {
  await db
    .update(iotShields)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(iotShields.id, id));
  return findIotShieldById(id);
}

export async function deleteIotShield(id: number) {
  await db.delete(iotShields).where(eq(iotShields.id, id));
}

export async function listIotShields(params: {
  exploitationIds?: number[] | null;
  page: number;
  limit: number;
  search?: string;
  sensorType?: string;
  status?: string;
}) {
  const conditions = [];

  if (params.exploitationIds && params.exploitationIds.length > 0) {
    conditions.push(inArray(iotShields.exploitationId, params.exploitationIds));
  }

  if (params.search) {
    conditions.push(
      or(
        like(iotShields.ssmIotNumber, `%${params.search}%`),
        like(animals.name, `%${params.search}%`),
        like(animals.rfid, `%${params.search}%`)
      )
    );
  }

  if (params.status) {
    conditions.push(eq(iotShields.status, params.status as any));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select({
      id: iotShields.id,
      ssmIotNumber: iotShields.ssmIotNumber,
      battery: iotShields.battery,
      animalId: iotShields.animalId,
      status: iotShields.status,
      exploitationId: iotShields.exploitationId,
      createdAt: iotShields.createdAt,
      updatedAt: iotShields.updatedAt,
      animal: {
        id: animals.id,
        rfid: animals.rfid,
        name: animals.name,
        breed: animals.breed,
        sex: animals.sex,
      },
    })
    .from(iotShields)
    .leftJoin(animals, eq(iotShields.animalId, animals.id))
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(iotShields.createdAt));

  const [{ total }] = await db
    .select({ total: count() })
    .from(iotShields)
    .leftJoin(animals, eq(iotShields.animalId, animals.id))
    .where(whereClause);

  return { rows, total };
}

export async function associateAnimalToShield(
  shieldId: number,
  animalId: number | null
) {
  await db
    .update(iotShields)
    .set({ animalId, updatedAt: new Date() })
    .where(eq(iotShields.id, shieldId));
  return findIotShieldById(shieldId);
}

export async function updateBattery(shieldId: number, battery: number) {
  await db
    .update(iotShields)
    .set({ battery: String(battery), updatedAt: new Date() })
    .where(eq(iotShields.id, shieldId));
  return findIotShieldById(shieldId);
}

export async function toggleStatus(shieldId: number) {
  const shield = await findIotShieldById(shieldId);
  if (!shield) return null;

  const newStatus = shield.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await db
    .update(iotShields)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(iotShields.id, shieldId));
  return findIotShieldById(shieldId);
}

// ── Shield Sensors CRUD ──

export async function listShieldSensors(shieldId: number) {
  return db
    .select()
    .from(iotShieldSensors)
    .where(eq(iotShieldSensors.shieldId, shieldId))
    .orderBy(iotShieldSensors.sensorType);
}

export async function createShieldSensor(shieldId: number, sensorType: string) {
  const [result] = await db
    .insert(iotShieldSensors)
    .values({ shieldId, sensorType: sensorType as any })
    .$returningId();
  return findShieldSensorById(result.id);
}

export async function findShieldSensorById(id: number) {
  const rows = await db
    .select()
    .from(iotShieldSensors)
    .where(eq(iotShieldSensors.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteShieldSensor(id: number) {
  await db.delete(iotShieldSensors).where(eq(iotShieldSensors.id, id));
}

export async function deleteShieldSensorsByShieldId(shieldId: number) {
  await db.delete(iotShieldSensors).where(eq(iotShieldSensors.shieldId, shieldId));
}
