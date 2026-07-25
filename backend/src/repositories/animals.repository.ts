import { db } from "../db/connection.js";
import { animals } from "../db/schema/animals.js";
import { eq, and, like, desc, count, or } from "drizzle-orm";

type CreateAnimalData = typeof animals.$inferInsert;
type UpdateAnimalData = Partial<CreateAnimalData>;

export async function findAnimalById(id: number) {
  const result = await db.query.animals.findFirst({
    where: eq(animals.id, id),
  });
  return result ?? null;
}

export async function findAnimalByRfid(rfid: string) {
  const result = await db.query.animals.findFirst({
    where: eq(animals.rfid, rfid),
  });
  return result ?? null;
}

export async function createAnimal(data: CreateAnimalData) {
  const [result] = await db.insert(animals).values(data).$returningId();
  return findAnimalById(result.id);
}

export async function updateAnimal(id: number, data: UpdateAnimalData) {
  await db
    .update(animals)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(animals.id, id));
  return findAnimalById(id);
}

export async function deleteAnimal(id: number) {
  await db.delete(animals).where(eq(animals.id, id));
}

export async function listAnimals(params: {
  page: number;
  limit: number;
  search?: string;
  breed?: string;
  sex?: string;
  healthStatus?: string;
}) {
  const conditions = [];

  if (params.search) {
    conditions.push(
      or(
        like(animals.name, `%${params.search}%`),
        like(animals.rfid, `%${params.search}%`)
      )
    );
  }
  if (params.breed) {
    conditions.push(eq(animals.breed, params.breed as any));
  }
  if (params.sex) {
    conditions.push(eq(animals.sex, params.sex as any));
  }
  if (params.healthStatus) {
    conditions.push(eq(animals.healthStatus, params.healthStatus as any));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(animals)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(animals.createdAt));

  const [{ total }] = await db
    .select({ total: count() })
    .from(animals)
    .where(whereClause);

  return { rows, total };
}
