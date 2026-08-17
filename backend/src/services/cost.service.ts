// backend/src/services/cost.service.ts

import { db } from '../db/connection.js';
import { expenses } from '../db/schema/expenses.js';
import { revenues } from '../db/schema/revenues.js';
import { animals } from '../db/schema/animals.js';
import { animalWeightRecords } from '../db/schema/animalWeightRecords.js'; // ✅ corrected import
import { getUserExploitationIds } from '../utils/permissions.js';
import { eq, inArray, and, between, sql, desc } from 'drizzle-orm';

export interface CostOfProduction {
  period: { startDate: string; endDate: string };
  directCosts: { category: string; total: number }[];
  indirectCosts: { category: string; total: number }[];
  totalDirectCost: number;
  totalIndirectCost: number;
  totalCost: number;
  totalWeightGained: number;
  costPerKg: number;
  benchmark?: { averageCostPerKg: number; percentile: number };
}

export class CostService {
  async getCostOfProduction(
    userId: number,
    roleName: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostOfProduction> {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) {
      return this.emptyCost(startDate, endDate);
    }

    // Direct categories (feed, health, reproduction)
    const directCategories = ['ALIMENTATION', 'SANTE', 'REPRODUCTION'];
    const indirectCategories = ['MAIN_DOEUVRE', 'EQUIPMENT', 'IOT', 'DIVERS'];

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

    const directCosts: { category: string; total: number }[] = [];
    const indirectCosts: { category: string; total: number }[] = [];
    let totalDirect = 0;
    let totalIndirect = 0;

    expenseRows.forEach(row => {
      if (directCategories.includes(row.category)) {
        directCosts.push({ category: row.category, total: row.total });
        totalDirect += row.total;
      } else {
        indirectCosts.push({ category: row.category, total: row.total });
        totalIndirect += row.total;
      }
    });

    // Get animals in exploitations
    const animalIdsResult = await db
      .select({ id: animals.id })
      .from(animals)
      .where(inArray(animals.exploitationId, allowedIds));
    const animalIds = animalIdsResult.map(a => a.id);

    let totalWeightGained = 0;
    if (animalIds.length > 0) {
      // Get weight stats per animal in period
      const weightStats = await db
        .select({
          animalId: animalWeightRecords.animalId,
          minWeight: sql<number>`MIN(${animalWeightRecords.weight})`.mapWith(Number).as('minWeight'),
          maxWeight: sql<number>`MAX(${animalWeightRecords.weight})`.mapWith(Number).as('maxWeight'),
        })
        .from(animalWeightRecords)
        .where(
          and(
            inArray(animalWeightRecords.animalId, animalIds),
            between(animalWeightRecords.date, startDate, endDate)
          )
        )
        .groupBy(animalWeightRecords.animalId);

      weightStats.forEach(stat => {
        if (stat.minWeight !== null && stat.maxWeight !== null && stat.maxWeight > stat.minWeight) {
          totalWeightGained += (stat.maxWeight - stat.minWeight);
        }
      });
    }

    // If no weight data, use a small default to avoid division by zero
    if (totalWeightGained === 0) {
      totalWeightGained = 0.001;
    }

    const totalCost = totalDirect + totalIndirect;
    const costPerKg = totalCost / totalWeightGained;

    // Placeholder benchmark (future: retrieve from external data)
    const benchmark = {
      averageCostPerKg: 0,
      percentile: 50,
    };

    return {
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      directCosts,
      indirectCosts,
      totalDirectCost: totalDirect,
      totalIndirectCost: totalIndirect,
      totalCost,
      totalWeightGained,
      costPerKg,
      benchmark,
    };
  }

  private emptyCost(startDate: Date, endDate: Date): CostOfProduction {
    return {
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      directCosts: [],
      indirectCosts: [],
      totalDirectCost: 0,
      totalIndirectCost: 0,
      totalCost: 0,
      totalWeightGained: 0,
      costPerKg: 0,
      benchmark: { averageCostPerKg: 0, percentile: 0 },
    };
  }
}