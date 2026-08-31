import { db } from "../db/connection.js";
import { products } from "../db/schema/products.js";
import { eq, and, like, desc, count, sql } from "drizzle-orm";

type Product = typeof products.$inferSelect;
type CreateProductData = typeof products.$inferInsert;
type UpdateProductData = Partial<CreateProductData>;

export async function findProductById(id: number): Promise<Product | null> {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] || null;
}

export async function createProduct(data: CreateProductData): Promise<Product> {
  const [result] = await db.insert(products).values(data).$returningId();
  return findProductById(result.id) as Promise<Product>;
}

export async function updateProduct(id: number, data: UpdateProductData): Promise<Product | null> {
  await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id));
  return findProductById(id);
}

export async function deleteProduct(id: number): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}

export async function listProducts(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  availability?: string;
}) {
  const conditions = [];

  if (params.search) {
    conditions.push(like(products.name, `%${params.search}%`));
  }

  if (params.category) {
    conditions.push(eq(products.category, params.category as any));
  }

  if (params.availability) {
    conditions.push(eq(products.availability, params.availability as any));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(products)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(products.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(products).where(whereClause);

  return { rows, total };
}
