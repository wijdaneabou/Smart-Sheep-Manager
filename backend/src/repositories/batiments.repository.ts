import { db } from "../db/connection.js";
import { batiments } from "../db/schema/batiments.js";
import { eq, and, desc, count } from "drizzle-orm";

type CreateBatimentData = typeof batiments.$inferInsert;
type UpdateBatimentData = Partial<CreateBatimentData>;

export async function findBatimentById(id: number) {
  const result = await db.query.batiments.findFirst({
    where: eq(batiments.id, id),
  });
  return result ?? null;
}

export async function createBatiment(data: CreateBatimentData) {
  const [result] = await db.insert(batiments).values(data).$returningId();
  return findBatimentById(result.id);
}

export async function updateBatiment(id: number, data: UpdateBatimentData) {
  await db
    .update(batiments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(batiments.id, id));
  return findBatimentById(id);
}

export async function deleteBatiment(id: number) {
  await db.delete(batiments).where(eq(batiments.id, id));
}

export async function listBatiments(params: {
  exploitationId: number;
  page: number;
  limit: number;
  type?: string;
}) {
  const conditions = [eq(batiments.exploitationId, params.exploitationId)];
  if (params.type) {
    conditions.push(eq(batiments.type, params.type as any));
  }

  const whereClause = and(...conditions);
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(batiments)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(batiments.createdAt));

  const [{ total }] = await db
    .select({ total: count() })
    .from(batiments)
    .where(whereClause);

  return { rows, total };
}