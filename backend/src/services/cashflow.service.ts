// backend/src/services/cashflow.service.ts

import { db } from '../db/connection.js';
import { expenses } from '../db/schema/expenses.js';
import { revenues } from '../db/schema/revenues.js';
import { getUserExploitationIds } from '../utils/permissions.js';
import { eq, inArray, and, between, sql, desc } from 'drizzle-orm';

export interface MonthlyCashflow {
  month: string; // YYYY-MM
  inflows: number;
  outflows: number;
  balance: number;
  cumulative: number;
}

export interface CashflowProjection {
  month: string;
  projectedInflows: number;
  projectedOutflows: number;
  projectedBalance: number;
  cumulative: number;
}

export class CashflowService {
  /**
   * Get actual cashflow data for a given period (inflows from revenues, outflows from expenses)
   */
  async getActualCashflow(
    userId: number,
    roleName: string,
    startDate: Date,
    endDate: Date
  ): Promise<MonthlyCashflow[]> {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) return [];

    // Get expenses (outflows) grouped by month
    const expenseData = await db
      .select({
        month: sql<string>`DATE_FORMAT(${expenses.date}, '%Y-%m')`.as('month'),
        total: sql<number>`SUM(${expenses.amount})`.mapWith(Number).as('total'),
      })
      .from(expenses)
      .where(
        and(
          inArray(expenses.exploitationId, allowedIds),
          between(expenses.date, startDate, endDate)
        )
      )
      .groupBy(sql`DATE_FORMAT(${expenses.date}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${expenses.date}, '%Y-%m')`);

    // Get revenues (inflows) grouped by month
    const revenueData = await db
      .select({
        month: sql<string>`DATE_FORMAT(${revenues.date}, '%Y-%m')`.as('month'),
        total: sql<number>`SUM(${revenues.totalTTC})`.mapWith(Number).as('total'),
      })
      .from(revenues)
      .where(
        and(
          inArray(revenues.exploitationId, allowedIds),
          between(revenues.date, startDate, endDate)
        )
      )
      .groupBy(sql`DATE_FORMAT(${revenues.date}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${revenues.date}, '%Y-%m')`);

    // Merge data by month
    const monthMap = new Map<string, { inflows: number; outflows: number }>();

    expenseData.forEach((row) => {
      if (!monthMap.has(row.month)) {
        monthMap.set(row.month, { inflows: 0, outflows: 0 });
      }
      monthMap.get(row.month)!.outflows = row.total;
    });

    revenueData.forEach((row) => {
      if (!monthMap.has(row.month)) {
        monthMap.set(row.month, { inflows: 0, outflows: 0 });
      }
      monthMap.get(row.month)!.inflows = row.total;
    });

    const result: MonthlyCashflow[] = [];
    let cumulative = 0;

    // Sort months chronologically
    const sortedMonths = Array.from(monthMap.keys()).sort();
    sortedMonths.forEach((month) => {
      const data = monthMap.get(month)!;
      const balance = data.inflows - data.outflows;
      cumulative += balance;
      result.push({
        month,
        inflows: data.inflows,
        outflows: data.outflows,
        balance,
        cumulative,
      });
    });

    return result;
  }

  /**
   * Get cashflow projection for the next N months based on historical averages.
   * Simple projection: average of last 3 months' inflows and outflows.
   */
  async getCashflowProjection(
    userId: number,
    roleName: string,
    months: number = 3
  ): Promise<CashflowProjection[]> {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) return [];

    // Get last 3 months of actual data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    const actualData = await this.getActualCashflow(userId, roleName, startDate, endDate);

    if (actualData.length === 0) {
      return [];
    }

    // Calculate average monthly inflows and outflows
    const avgInflows = actualData.reduce((sum, m) => sum + m.inflows, 0) / actualData.length;
    const avgOutflows = actualData.reduce((sum, m) => sum + m.outflows, 0) / actualData.length;
    const avgBalance = avgInflows - avgOutflows;

    const projections: CashflowProjection[] = [];
    let cumulative = actualData[actualData.length - 1]?.cumulative || 0;

    const currentDate = new Date();
    for (let i = 0; i < months; i++) {
      const projectedMonth = new Date(currentDate);
      projectedMonth.setMonth(projectedMonth.getMonth() + i + 1);
      const monthStr = projectedMonth.toISOString().slice(0, 7); // YYYY-MM

      cumulative += avgBalance;

      projections.push({
        month: monthStr,
        projectedInflows: avgInflows,
        projectedOutflows: avgOutflows,
        projectedBalance: avgBalance,
        cumulative,
      });
    }

    return projections;
  }

  /**
   * Get combined actual + projected cashflow for dashboard.
   */
  async getFullCashflow(
    userId: number,
    roleName: string,
    months: number = 3
  ): Promise<{ actual: MonthlyCashflow[]; projection: CashflowProjection[] }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12); // Last 12 months

    const actual = await this.getActualCashflow(userId, roleName, startDate, endDate);
    const projection = await this.getCashflowProjection(userId, roleName, months);

    return { actual, projection };
  }

  /**
   * Get cashflow summary for quick dashboard view.
   */
  async getCashflowSummary(userId: number, roleName: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // Current month

    const monthData = await this.getActualCashflow(userId, roleName, startDate, endDate);

    if (monthData.length === 0) {
      return {
        currentMonth: {
          month: new Date().toISOString().slice(0, 7),
          inflows: 0,
          outflows: 0,
          balance: 0,
          cumulative: 0,
        },
        yearToDate: { inflows: 0, outflows: 0, balance: 0 },
        alert: null,
      };
    }

    const currentMonth = monthData[monthData.length - 1];
    const yearToDate = monthData.reduce(
      (acc, m) => ({
        inflows: acc.inflows + m.inflows,
        outflows: acc.outflows + m.outflows,
        balance: acc.balance + m.balance,
      }),
      { inflows: 0, outflows: 0, balance: 0 }
    );

    // Simple alert: if current month balance is negative
    const alert = currentMonth.balance < 0
      ? {
          type: 'warning',
          message: `Solde négatif ce mois-ci: ${currentMonth.balance.toFixed(2)} MAD`,
        }
      : null;

    return {
      currentMonth,
      yearToDate,
      alert,
    };
  }
}