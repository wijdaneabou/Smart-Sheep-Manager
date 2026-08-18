import { db } from "../db/connection.js";
import { fatteningBatches } from "../db/schema/fatteningBatches.js";
import { exploitations } from "../db/schema/exploitations.js";
import { eq, and, like, desc, count, inArray, sql } from "drizzle-orm";

type CreateFatteningBatchData = typeof fatteningBatches.$inferInsert;
type UpdateFatteningBatchData = Partial<CreateFatteningBatchData>;

export async function findFatteningBatchById(id: number) {
  const rows = await db
    .select({
      id: fatteningBatches.id,
      name: fatteningBatches.name,
      startDate: fatteningBatches.startDate,
      animalCount: fatteningBatches.animalCount,
      initialAverageWeight: fatteningBatches.initialAverageWeight,
      targetWeight: fatteningBatches.targetWeight,
      targetDailyGmq: fatteningBatches.targetDailyGmq,
      estimatedEndDate: fatteningBatches.estimatedEndDate,
      status: fatteningBatches.status,
      exploitationId: fatteningBatches.exploitationId,
      notes: fatteningBatches.notes,
      createdAt: fatteningBatches.createdAt,
      updatedAt: fatteningBatches.updatedAt,
      exploitation: {
        id: exploitations.id,
        name: exploitations.name,
        type: exploitations.type,
        superficie: exploitations.superficie,
        latitude: exploitations.latitude,
        longitude: exploitations.longitude,
        photo: exploitations.photo,
        ownerId: exploitations.ownerId,
        createdAt: exploitations.createdAt,
        updatedAt: exploitations.updatedAt,
      },
    })
    .from(fatteningBatches)
    .leftJoin(exploitations, eq(fatteningBatches.exploitationId, exploitations.id))
    .where(eq(fatteningBatches.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    startDate: row.startDate,
    animalCount: row.animalCount,
    initialAverageWeight: row.initialAverageWeight,
    targetWeight: row.targetWeight,
    targetDailyGmq: row.targetDailyGmq,
    estimatedEndDate: row.estimatedEndDate,
    status: row.status,
    exploitationId: row.exploitationId,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    exploitation: row.exploitation,
  };
}

export async function createFatteningBatch(data: CreateFatteningBatchData) {
  const [result] = await db.insert(fatteningBatches).values(data).$returningId();
  return findFatteningBatchById(result.id);
}

export async function updateFatteningBatch(id: number, data: UpdateFatteningBatchData) {
  await db
    .update(fatteningBatches)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(fatteningBatches.id, id));
  return findFatteningBatchById(id);
}

export async function deleteFatteningBatch(id: number) {
  await db.delete(fatteningBatches).where(eq(fatteningBatches.id, id));
}

export async function listFatteningBatches(
  params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    exploitationId?: number;
  },
  exploitationIds?: number[]
) {
  const conditions = [];

  if (exploitationIds && exploitationIds.length > 0) {
    conditions.push(inArray(fatteningBatches.exploitationId, exploitationIds));
  } else if (exploitationIds && exploitationIds.length === 0) {
    return { rows: [], total: 0 };
  }

  if (params.search) {
    conditions.push(like(fatteningBatches.name, `%${params.search}%`));
  }

  if (params.status) {
    conditions.push(eq(fatteningBatches.status, params.status as any));
  }

  if (params.exploitationId) {
    conditions.push(eq(fatteningBatches.exploitationId, params.exploitationId));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select({
      id: fatteningBatches.id,
      name: fatteningBatches.name,
      startDate: fatteningBatches.startDate,
      animalCount: fatteningBatches.animalCount,
      initialAverageWeight: fatteningBatches.initialAverageWeight,
      targetWeight: fatteningBatches.targetWeight,
      targetDailyGmq: fatteningBatches.targetDailyGmq,
      estimatedEndDate: fatteningBatches.estimatedEndDate,
      status: fatteningBatches.status,
      exploitationId: fatteningBatches.exploitationId,
      notes: fatteningBatches.notes,
      createdAt: fatteningBatches.createdAt,
      updatedAt: fatteningBatches.updatedAt,
      exploitation: {
        id: exploitations.id,
        name: exploitations.name,
        type: exploitations.type,
        superficie: exploitations.superficie,
        latitude: exploitations.latitude,
        longitude: exploitations.longitude,
        photo: exploitations.photo,
        ownerId: exploitations.ownerId,
        createdAt: exploitations.createdAt,
        updatedAt: exploitations.updatedAt,
      },
    })
    .from(fatteningBatches)
    .leftJoin(exploitations, eq(fatteningBatches.exploitationId, exploitations.id))
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(fatteningBatches.createdAt));

  const [{ total }] = await db
    .select({ total: count() })
    .from(fatteningBatches)
    .where(whereClause);

  return { rows, total };
}
