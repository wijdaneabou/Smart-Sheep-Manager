import { db } from "../db/connection.js";
import { animalWeightRecords } from "../db/schema/animalWeightRecords.js";
import { animals } from "../db/schema/animals.js";
import { eq, and, desc, gte, lte, SQL } from "drizzle-orm";

type CreateWeightData = typeof animalWeightRecords.$inferInsert;

export async function findWeightRecordById(id: number) {
  const result = await db.query.animalWeightRecords.findFirst({
    where: eq(animalWeightRecords.id, id),
    with: { animal: true },
  });
  return result ?? null;
}

export async function createWeightRecord(data: CreateWeightData) {
  const [result] = await db
    .insert(animalWeightRecords)
    .values(data)
    .$returningId();
  return findWeightRecordById(result.id);
}

export async function findWeightRecordsByAnimal(animalId: number) {
  return await db
    .select()
    .from(animalWeightRecords)
    .where(eq(animalWeightRecords.animalId, animalId))
    .orderBy(desc(animalWeightRecords.date));
}

export async function listWeightRecords(params: {
  animalId?: number;
  from?: string;
  to?: string;
}) {
  const conditions: SQL[] = [];

  if (params.animalId) {
    conditions.push(eq(animalWeightRecords.animalId, params.animalId));
  }
  if (params.from) {
    conditions.push(gte(animalWeightRecords.date, new Date(params.from)));
  }
  if (params.to) {
    conditions.push(lte(animalWeightRecords.date, new Date(params.to)));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(animalWeightRecords)
    .leftJoin(animals, eq(animalWeightRecords.animalId, animals.id))
    .where(whereClause)
    .orderBy(desc(animalWeightRecords.date));

  return { rows };
}
