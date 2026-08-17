import { db } from '../db/connection.js';
import { budgets, type Budget, type NewBudget } from '../db/schema/index.js';
import { getUserExploitationIds } from '../utils/permissions.js';
import { eq, inArray, and, sql, desc } from 'drizzle-orm';

export class BudgetService {
  async getBudgets(
    userId: number,
    roleName: string,
    filters?: { year?: number; month?: number; category?: string }
  ) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) return [];

    let conditions: any[] = [inArray(budgets.exploitationId, allowedIds)];

    if (filters?.year) {
      conditions.push(eq(budgets.year, filters.year));
    }
    if (filters?.month !== undefined) {
      if (filters.month === null) {
        conditions.push(sql`${budgets.month} IS NULL`);
      } else {
        conditions.push(eq(budgets.month, filters.month));
      }
    }
    if (filters?.category) {
      conditions.push(eq(budgets.category, filters.category as any));
    }

    return await db
      .select()
      .from(budgets)
      .where(and(...conditions))
      .orderBy(desc(budgets.year), desc(budgets.month));
  }

  async getBudgetById(id: number, userId: number, roleName: string) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) return null;

    const [budget] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.id, id),
          inArray(budgets.exploitationId, allowedIds)
        )
      );
    return budget || null;
  }

  async createBudget(userId: number, roleName: string, data: any) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.includes(data.exploitationId)) {
      throw new Error('Accès non autorisé à cette exploitation');
    }

    // Ensure plannedAmount is string for DB
    const insertData = {
      ...data,
      plannedAmount: data.plannedAmount?.toString() || '0.00',
      actualAmount: '0.00',
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [inserted] = await db
      .insert(budgets)
      .values(insertData)
      .$returningId();

    const [created] = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, inserted.id));
    return created;
  }

  async updateBudget(id: number, userId: number, roleName: string, data: any) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    const [existing] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.id, id),
          inArray(budgets.exploitationId, allowedIds)
        )
      );

    if (!existing) {
      throw new Error('Budget non trouvé ou accès non autorisé');
    }

    if (data.exploitationId && !allowedIds.includes(data.exploitationId)) {
      throw new Error('Accès non autorisé à la nouvelle exploitation');
    }

    // Convert plannedAmount to string if provided
    const updateData: any = { ...data };
    if (updateData.plannedAmount !== undefined) {
      updateData.plannedAmount = updateData.plannedAmount.toString();
    }
    updateData.updatedBy = userId;
    updateData.updatedAt = new Date();

    await db
      .update(budgets)
      .set(updateData)
      .where(eq(budgets.id, id));

    const [updated] = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, id));
    return updated;
  }

  async deleteBudget(id: number, userId: number, roleName: string) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    const [existing] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.id, id),
          inArray(budgets.exploitationId, allowedIds)
        )
      );

    if (!existing) {
      throw new Error('Budget non trouvé ou accès non autorisé');
    }

    await db.delete(budgets).where(eq(budgets.id, id));
    return true;
  }

  async getBudgetSummary(userId: number, roleName: string, year: number) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) return [];

    const results = await db
      .select({
        category: budgets.category,
        planned: sql<number>`SUM(${budgets.plannedAmount})`.mapWith(Number),
        actual: sql<number>`SUM(${budgets.actualAmount})`.mapWith(Number),
        variance: sql<number>`SUM(${budgets.plannedAmount}) - SUM(${budgets.actualAmount})`.mapWith(Number),
      })
      .from(budgets)
      .where(
        and(
          inArray(budgets.exploitationId, allowedIds),
          eq(budgets.year, year)
        )
      )
      .groupBy(budgets.category);

    return results.map(row => ({
      ...row,
      variance: Number(row.variance) || 0,
      planned: Number(row.planned) || 0,
      actual: Number(row.actual) || 0,
    }));
  }
}