import { db } from "../db/connection.js";
import { animalBcsRecords } from "../db/schema/animalBcsRecords.js";
import { animals } from "../db/schema/animals.js";
import { eq, and, desc, gte, lte, SQL } from "drizzle-orm";

type CreateBcsData = typeof animalBcsRecords.$inferInsert;

export async function findBcsRecordById(id: number) {
  const result = await db.query.animalBcsRecords.findFirst({
    where: eq(animalBcsRecords.id, id),
    with: { animal: true },
  });
  return result ?? null;
}

export async function createBcsRecord(data: CreateBcsData) {
  const [result] = await db
    .insert(animalBcsRecords)
    .values(data)
    .$returningId();
  return findBcsRecordById(result.id);
}

export async function findBcsRecordsByAnimal(animalId: number) {
  return await db
    .select()
    .from(animalBcsRecords)
    .where(eq(animalBcsRecords.animalId, animalId))
    .orderBy(desc(animalBcsRecords.date), desc(animalBcsRecords.createdAt));
}

export async function findLatestBcsRecordByAnimal(animalId: number) {
  const records = await db
    .select()
    .from(animalBcsRecords)
    .where(eq(animalBcsRecords.animalId, animalId))
    .orderBy(desc(animalBcsRecords.date), desc(animalBcsRecords.createdAt))
    .limit(1);

  return records[0] ?? null;
}

export async function listAllBcsRecords(params: {
  animalId?: number;
  from?: string;
  to?: string;
}) {
  const conditions: SQL[] = [];

  if (params.animalId) {
    conditions.push(eq(animalBcsRecords.animalId, params.animalId));
  }
  if (params.from) {
    conditions.push(gte(animalBcsRecords.date, params.from as any));
  }
  if (params.to) {
    conditions.push(lte(animalBcsRecords.date, params.to as any));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: animalBcsRecords.id,
      animalId: animalBcsRecords.animalId,
      bcsScore: animalBcsRecords.bcsScore,
      spinousProcesses: animalBcsRecords.spinousProcesses,
      transverseProcesses: animalBcsRecords.transverseProcesses,
      eyeMuscle: animalBcsRecords.eyeMuscle,
      fatCover: animalBcsRecords.fatCover,
      tailDock: animalBcsRecords.tailDock,
      date: animalBcsRecords.date,
      evaluator: animalBcsRecords.evaluator,
      notes: animalBcsRecords.notes,
      nutritionalRecommendation: animalBcsRecords.nutritionalRecommendation,
      createdAt: animalBcsRecords.createdAt,
      animalName: animals.name,
      animalRfid: animals.rfid,
      animalBreed: animals.breed,
    })
    .from(animalBcsRecords)
    .leftJoin(animals, eq(animalBcsRecords.animalId, animals.id))
    .where(whereClause)
    .orderBy(desc(animalBcsRecords.date), desc(animalBcsRecords.createdAt));

  return rows;
}
