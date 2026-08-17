// backend/src/services/profitability.service.ts

import { db } from '../db/connection.js';
import { expenses } from '../db/schema/expenses.js';
import { revenues } from '../db/schema/revenues.js';
import { animals } from '../db/schema/animals.js';
import { getUserExploitationIds } from '../utils/permissions.js';
import { eq, inArray, and, between, sql, desc } from 'drizzle-orm';

export interface ProfitabilitySummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalCosts: number;
  totalRevenues: number;
  grossMargin: number;
  netMargin: number;
  costsByCategory: Record<string, number>;
  revenuesByType: Record<string, number>;
}

export interface AnimalProfitability {
  animalId: number;
  animalName: string;
  rfid: string;
  totalCost: number;
  totalRevenue: number;
  margin: number;
}

export class ProfitabilityService {
  /**
   * Get overall profitability for a given period and exploitation(s).
   */
  async getProfitabilitySummary(
    userId: number,
    roleName: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProfitabilitySummary> {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) {
      return this.emptySummary(startDate, endDate);
    }

    // Get expenses
    const expenseRows = await db
      .select({
        category: expenses.category,
        total: sql<number>`SUM(${expenses.amount})`.mapWith(Number).as('total'),
      })
      .from(expenses)
      .where(
        and(
          inArray(expenses.exploitationId, allowedIds),
          between(expenses.date, startDate, endDate)
        )
      )
      .groupBy(expenses.category);

    // Get revenues
    const revenueRows = await db
      .select({
        type: revenues.type,
        total: sql<number>`SUM(${revenues.totalTTC})`.mapWith(Number).as('total'),
      })
      .from(revenues)
      .where(
        and(
          inArray(revenues.exploitationId, allowedIds),
          between(revenues.date, startDate, endDate)
        )
      )
      .groupBy(revenues.type);

    const costsByCategory: Record<string, number> = {};
    let totalCosts = 0;
    expenseRows.forEach((row) => {
      costsByCategory[row.category] = row.total;
      totalCosts += row.total;
    });

    const revenuesByType: Record<string, number> = {};
    let totalRevenues = 0;
    revenueRows.forEach((row) => {
      revenuesByType[row.type] = row.total;
      totalRevenues += row.total;
    });

    const grossMargin = totalRevenues - totalCosts;

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalCosts,
      totalRevenues,
      grossMargin,
      netMargin: grossMargin, // For now, we don't have other indirect costs
      costsByCategory,
      revenuesByType,
    };
  }

  /**
   * Get profitability per animal (currently a placeholder – will be extended later)
   */
  async getAnimalProfitability(
    userId: number,
    roleName: string,
    startDate: Date,
    endDate: Date,
    animalId?: number
  ): Promise<AnimalProfitability[]> {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) return [];

    // For now, we return empty array with a note.
    // In the future, we'll join expenses and revenues with animals.
    // Since we don't have animal_id in expenses yet, we can't compute per-animal.
    return [];
  }

  private emptySummary(startDate: Date, endDate: Date): ProfitabilitySummary {
    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalCosts: 0,
      totalRevenues: 0,
      grossMargin: 0,
      netMargin: 0,
      costsByCategory: {},
      revenuesByType: {},
    };
  }
}