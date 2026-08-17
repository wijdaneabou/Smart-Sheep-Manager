// backend/src/services/expense.service.ts

import { db } from '../db/connection.js';
import { expenses, type Expense, type NewExpense } from '../db/schema/index.js';
import { getUserExploitationIds } from '../utils/permissions.js';
import { eq, inArray, and, between, desc, sql } from 'drizzle-orm';

export class ExpenseService {
  async getExpenses(
    userId: number,
    roleName: string,
    filters?: { startDate?: Date; endDate?: Date; category?: string }
  ) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) return [];

    let conditions: any[] = [inArray(expenses.exploitationId, allowedIds)];

    if (filters?.startDate && filters?.endDate) {
      conditions.push(between(expenses.date, filters.startDate, filters.endDate));
    } else if (filters?.startDate) {
      conditions.push(sql`${expenses.date} >= ${filters.startDate}`);
    } else if (filters?.endDate) {
      conditions.push(sql`${expenses.date} <= ${filters.endDate}`);
    }
    if (filters?.category) {
      conditions.push(eq(expenses.category, filters.category as any));
    }

    return await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.date));
  }

  async getExpenseById(id: number, userId: number, roleName: string) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) return null;

    const [expense] = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, id),
          inArray(expenses.exploitationId, allowedIds)
        )
      );
    return expense || null;
  }

  async createExpense(userId: number, roleName: string, data: NewExpense) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.includes(data.exploitationId)) {
      throw new Error('Accès non autorisé à cette exploitation');
    }

    const [inserted] = await db
      .insert(expenses)
      .values({
        ...data,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    const [created] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, inserted.id));
    return created;
  }

  async updateExpense(id: number, userId: number, roleName: string, data: Partial<NewExpense>) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    const [existing] = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, id),
          inArray(expenses.exploitationId, allowedIds)
        )
      );

    if (!existing) {
      throw new Error('Dépense non trouvée ou accès non autorisé');
    }

    if (data.exploitationId && !allowedIds.includes(data.exploitationId)) {
      throw new Error('Accès non autorisé à la nouvelle exploitation');
    }

    await db
      .update(expenses)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id));

    const [updated] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));
    return updated;
  }

  async deleteExpense(id: number, userId: number, roleName: string) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    const [existing] = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, id),
          inArray(expenses.exploitationId, allowedIds)
        )
      );

    if (!existing) {
      throw new Error('Dépense non trouvée ou accès non autorisé');
    }

    await db.delete(expenses).where(eq(expenses.id, id));
    return true;
  }
}