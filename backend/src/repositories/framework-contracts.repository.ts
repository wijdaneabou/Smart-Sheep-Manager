import { db } from "../db/connection.js";
import { frameworkContracts } from "../db/schema/framework-contracts.js";
import { eq, and, like, desc, count, sql } from "drizzle-orm";

type FrameworkContract = typeof frameworkContracts.$inferSelect;
type CreateFrameworkContractData = typeof frameworkContracts.$inferInsert;
type UpdateFrameworkContractData = Partial<CreateFrameworkContractData>;

export type { FrameworkContract };

export async function findFrameworkContractById(id: number): Promise<FrameworkContract | null> {
  const rows = await db.select().from(frameworkContracts).where(eq(frameworkContracts.id, id)).limit(1);
  return rows[0] || null;
}

export async function createFrameworkContract(data: CreateFrameworkContractData): Promise<FrameworkContract> {
  const [result] = await db.insert(frameworkContracts).values(data).$returningId();
  return findFrameworkContractById(result.id) as Promise<FrameworkContract>;
}

export async function updateFrameworkContract(id: number, data: UpdateFrameworkContractData): Promise<FrameworkContract | null> {
  await db.update(frameworkContracts).set({ ...data, updatedAt: new Date() }).where(eq(frameworkContracts.id, id));
  return findFrameworkContractById(id);
}

export async function deleteFrameworkContract(id: number): Promise<void> {
  await db.delete(frameworkContracts).where(eq(frameworkContracts.id, id));
}

export async function listFrameworkContracts(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  clientId?: number;
}) {
  const conditions = [];

  if (params.search) {
    conditions.push(like(frameworkContracts.contractNumber, `%${params.search}%`));
  }

  if (params.status) {
    conditions.push(eq(frameworkContracts.status, params.status as any));
  }

  if (params.clientId) {
    conditions.push(eq(frameworkContracts.clientId, params.clientId));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(frameworkContracts)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(frameworkContracts.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(frameworkContracts).where(whereClause);

  return { rows, total };
}
