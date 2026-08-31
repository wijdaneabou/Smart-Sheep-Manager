import { db } from "../db/connection.js";
import { clients } from "../db/schema/clients.js";
import { eq, and, like, desc, count, sql } from "drizzle-orm";

type Client = typeof clients.$inferSelect;
type CreateClientData = typeof clients.$inferInsert;
type UpdateClientData = Partial<CreateClientData>;

export async function findClientById(id: number): Promise<Client | null> {
  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);

  return rows[0] || null;
}

export async function createClient(data: CreateClientData): Promise<Client> {
  const [result] = await db.insert(clients).values(data).$returningId();
  return findClientById(result.id) as Promise<Client>;
}

export async function updateClient(id: number, data: UpdateClientData): Promise<Client | null> {
  await db
    .update(clients)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clients.id, id));
  return findClientById(id);
}

export async function deleteClient(id: number): Promise<void> {
  await db.delete(clients).where(eq(clients.id, id));
}

export async function listClients(params: {
  page: number;
  limit: number;
  search?: string;
  type?: string;
}) {
  const conditions = [];

  if (params.search) {
    conditions.push(like(clients.name, `%${params.search}%`));
  }

  if (params.type) {
    conditions.push(eq(clients.type, params.type as any));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(clients)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(clients.createdAt));

  const [{ total }] = await db
    .select({ total: count() })
    .from(clients)
    .where(whereClause);

  return { rows, total };
}
