import { db } from "../db/connection.js";
import { fatteningAlerts } from "../db/schema/fatteningAlerts.js";
import { fatteningBatches } from "../db/schema/fatteningBatches.js";
import { exploitations } from "../db/schema/exploitations.js";
import { eq, and, desc, count, sql } from "drizzle-orm";

type CreateFatteningAlertData = typeof fatteningAlerts.$inferInsert;

export async function findFatteningAlertById(id: number) {
  const rows = await db
    .select()
    .from(fatteningAlerts)
    .where(eq(fatteningAlerts.id, id))
    .limit(1);

  return rows[0] || null;
}

export async function createFatteningAlert(data: CreateFatteningAlertData) {
  const [result] = await db
    .insert(fatteningAlerts)
    .values(data)
    .$returningId();
  return findFatteningAlertById(result.id);
}

export async function updateFatteningAlert(id: number, data: Partial<CreateFatteningAlertData>) {
  await db
    .update(fatteningAlerts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(fatteningAlerts.id, id));
  return findFatteningAlertById(id);
}

export async function resolveFatteningAlert(id: number) {
  await db
    .update(fatteningAlerts)
    .set({ resolved: 1, resolvedAt: new Date(), updatedAt: new Date() })
    .where(eq(fatteningAlerts.id, id));
  return findFatteningAlertById(id);
}

export async function listFatteningAlertsByBatch(batchId: number, options?: { resolved?: boolean }) {
  const conditions = [eq(fatteningAlerts.fatteningBatchId, batchId)];

  if (options?.resolved !== undefined) {
    conditions.push(eq(fatteningAlerts.resolved, options.resolved ? 1 : 0));
  }

  return db
    .select()
    .from(fatteningAlerts)
    .where(and(...conditions))
    .orderBy(desc(fatteningAlerts.createdAt));
}

export async function listFatteningAlertsByExploitation(
  exploitationId: number,
  options?: { resolved?: boolean; type?: string; limit?: number; offset?: number }
) {
  const conditions = [eq(fatteningAlerts.exploitationId, exploitationId)];

  if (options?.resolved !== undefined) {
    conditions.push(eq(fatteningAlerts.resolved, options.resolved ? 1 : 0));
  }
  if (options?.type) {
    conditions.push(eq(fatteningAlerts.type, options.type as any));
  }

  const whereClause = and(...conditions);
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const rows = await db
    .select()
    .from(fatteningAlerts)
    .where(whereClause)
    .orderBy(desc(fatteningAlerts.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(fatteningAlerts)
    .where(whereClause);

  return { rows, total };
}

export async function countUnresolvedFatteningAlertsByExploitation(exploitationId: number) {
  const result = await db
    .select({
      type: fatteningAlerts.type,
      count: sql<number>`count(*)`,
    })
    .from(fatteningAlerts)
    .where(
      and(
        eq(fatteningAlerts.exploitationId, exploitationId),
        eq(fatteningAlerts.resolved, 0)
      )
    )
    .groupBy(fatteningAlerts.type);
  return result;
}

export async function hasUnresolvedFatteningAlert(batchId: number, type: string): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(fatteningAlerts)
    .where(
      and(
        eq(fatteningAlerts.fatteningBatchId, batchId),
        eq(fatteningAlerts.type, type as any),
        eq(fatteningAlerts.resolved, 0)
      )
    );
  return Number(result[0]?.count ?? 0) > 0;
}

export async function listUnresolvedFatteningAlertsByBatch(batchId: number) {
  return db
    .select()
    .from(fatteningAlerts)
    .where(and(eq(fatteningAlerts.fatteningBatchId, batchId), eq(fatteningAlerts.resolved, 0)))
    .orderBy(desc(fatteningAlerts.createdAt));
}
