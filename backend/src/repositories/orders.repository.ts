import { db } from "../db/connection.js";
import { orders, orderItems } from "../db/schema/orders.js";
import { clients } from "../db/schema/clients.js";
import { eq, and, like, desc, count, sql, inArray } from "drizzle-orm";

type Order = typeof orders.$inferSelect;
type OrderItem = typeof orderItems.$inferSelect;
export type { Order, OrderItem };
type CreateOrderData = typeof orders.$inferInsert;
type UpdateOrderData = Partial<CreateOrderData>;
type CreateOrderItemData = typeof orderItems.$inferInsert;

export async function findOrderById(id: number): Promise<Order | null> {
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0] || null;
}

export async function findOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function findClientById(id: number): Promise<{ id: number; name: string; contact: string } | null> {
  const rows = await db
    .select({ id: clients.id, name: clients.name, contact: clients.contact })
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const [result] = await db.insert(orders).values(data).$returningId();
  return findOrderById(result.id) as Promise<Order>;
}

export async function createOrderItem(data: CreateOrderItemData): Promise<OrderItem> {
  const [result] = await db.insert(orderItems).values(data).$returningId();
  const rows = await db.select().from(orderItems).where(eq(orderItems.id, result.id)).limit(1);
  return rows[0];
}

export async function updateOrder(id: number, data: UpdateOrderData): Promise<Order | null> {
  await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id));
  return findOrderById(id);
}

export async function deleteOrderItems(orderId: number): Promise<void> {
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function deleteOrder(id: number): Promise<void> {
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.delete(orders).where(eq(orders.id, id));
}

export async function listOrders(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  clientId?: number;
}) {
  const conditions = [];

  if (params.search) {
    conditions.push(like(orders.orderNumber, `%${params.search}%`));
  }

  if (params.status) {
    conditions.push(eq(orders.status, params.status as any));
  }

  if (params.clientId) {
    conditions.push(eq(orders.clientId, params.clientId));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(orders)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(orders.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(orders).where(whereClause);

  return { rows, total };
}
