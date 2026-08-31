import { db } from "../db/connection.js";
import { deliveries } from "../db/schema/deliveries.js";
import { eq, and, like, desc, count } from "drizzle-orm";

type Delivery = typeof deliveries.$inferSelect;
type CreateDeliveryData = typeof deliveries.$inferInsert;
type UpdateDeliveryData = Partial<CreateDeliveryData>;

export type { Delivery };

export async function findDeliveryById(id: number): Promise<Delivery | null> {
  const rows = await db.select().from(deliveries).where(eq(deliveries.id, id)).limit(1);
  return rows[0] || null;
}

export async function createDelivery(data: CreateDeliveryData): Promise<Delivery> {
  const [result] = await db.insert(deliveries).values(data).$returningId();
  return findDeliveryById(result.id) as Promise<Delivery>;
}

export async function updateDelivery(id: number, data: UpdateDeliveryData): Promise<Delivery | null> {
  await db.update(deliveries).set({ ...data, updatedAt: new Date() }).where(eq(deliveries.id, id));
  return findDeliveryById(id);
}

export async function deleteDelivery(id: number): Promise<void> {
  await db.delete(deliveries).where(eq(deliveries.id, id));
}

export async function listDeliveries(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) {
  const conditions = [];

  if (params.search) {
    conditions.push(like(deliveries.deliveryNumber, `%${params.search}%`));
  }

  if (params.status) {
    conditions.push(eq(deliveries.status, params.status as any));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(deliveries)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(deliveries.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(deliveries).where(whereClause);

  return { rows, total };
}
