import { db } from "../db/connection.js";
import { animalMovements } from "../db/schema/animalMovements.js";
import { animals } from "../db/schema/animals.js";
import { eq, and, desc, count, gte, lte, SQL } from "drizzle-orm";

type CreateMovementData = typeof animalMovements.$inferInsert;

export async function findMovementById(id: number) {
  const result = await db.query.animalMovements.findFirst({
    where: eq(animalMovements.id, id),
    with: { animal: true },
  });
  return result ?? null;
}

export async function createMovement(data: CreateMovementData) {
  const [result] = await db
    .insert(animalMovements)
    .values(data)
    .$returningId();
  return findMovementById(result.id);
}

export async function listMovements(params: {
  page: number;
  limit: number;
  animalId?: number;
  type?: string;
  from?: string;
  to?: string;
}) {
  const conditions: SQL[] = [];

  if (params.animalId) {
    conditions.push(eq(animalMovements.animalId, params.animalId));
  }
  if (params.type) {
    conditions.push(eq(animalMovements.type, params.type as any));
  }
  if (params.from) {
    conditions.push(gte(animalMovements.date, new Date(params.from)));
  }
  if (params.to) {
    conditions.push(lte(animalMovements.date, new Date(params.to)));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(animalMovements)
    .leftJoin(animals, eq(animalMovements.animalId, animals.id))
    .where(whereClause)
    .orderBy(desc(animalMovements.date))
    .limit(params.limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(animalMovements)
    .where(whereClause);

  return { rows, total };
}
