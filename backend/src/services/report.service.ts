// backend/src/services/report.service.ts

import { db } from '../db/connection.js';
import { expenses } from '../db/schema/expenses.js';
import { revenues } from '../db/schema/revenues.js';
import { getUserExploitationIds } from '../utils/permissions.js';
import { and, inArray, between, sql } from 'drizzle-orm';

export interface PnLReport {
  period: { startDate: string; endDate: string };
  revenues: { category: string; total: number }[];
  expenses: { category: string; total: number }[];
  totalRevenues: number;
  totalExpenses: number;
  netProfit: number;
  revenueTotal: number;
  expenseTotal: number;
}

export class ReportService {
  async getPnL(userId: number, roleName: string, startDate: Date, endDate: Date): Promise<PnLReport> {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) {
      return {
        period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        revenues: [],
        expenses: [],
        totalRevenues: 0,
        totalExpenses: 0,
        netProfit: 0,
        revenueTotal: 0,
        expenseTotal: 0,
      };
    }

    // Revenues by type
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

    // Expenses by category
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

    const revenuesData = revenueRows.map(r => ({ category: r.type, total: r.total }));
    const expensesData = expenseRows.map(r => ({ category: r.category, total: r.total }));
    const totalRevenues = revenuesData.reduce((sum, r) => sum + r.total, 0);
    const totalExpenses = expensesData.reduce((sum, r) => sum + r.total, 0);

    return {
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      revenues: revenuesData,
      expenses: expensesData,
      totalRevenues,
      totalExpenses,
      netProfit: totalRevenues - totalExpenses,
      revenueTotal: totalRevenues,
      expenseTotal: totalExpenses,
    };
  }

  generatePnLCSV(report: PnLReport): string {
    const lines: string[] = [];
    lines.push(`Période du,${report.period.startDate},au,${report.period.endDate}`);
    lines.push('');
    lines.push('Revenus');
    report.revenues.forEach(r => lines.push(`${r.category},${r.total}`));
    lines.push(`Total Revenus,,${report.totalRevenues}`);
    lines.push('');
    lines.push('Dépenses');
    report.expenses.forEach(e => lines.push(`${e.category},${e.total}`));
    lines.push(`Total Dépenses,,${report.totalExpenses}`);
    lines.push('');
    lines.push(`Résultat Net,,${report.netProfit}`);
    return lines.join('\n');
  }

  generateFEC(report: PnLReport, startDate: Date, endDate: Date): string {
    const lines: string[] = [];
    lines.push('Journal,Date,Compte,Libellé,Débit,Credit');
    const start = startDate.toISOString().slice(0,10);
    const codeMap: Record<string, { revenue: string; expense: string }> = {
      ALIMENTATION: { revenue: '707', expense: '607' },
      SANTE: { revenue: '707', expense: '617' },
      MAIN_DOEUVRE: { revenue: '707', expense: '641' },
      EQUIPMENT: { revenue: '707', expense: '606' },
      REPRODUCTION: { revenue: '707', expense: '612' },
      IOT: { revenue: '707', expense: '608' },
      DIVERS: { revenue: '707', expense: '658' },
      LAMB_SALE: { revenue: '707', expense: '' },
      WOOL_SALE: { revenue: '707', expense: '' },
      BY_PRODUCT: { revenue: '707', expense: '' },
      OTHER: { revenue: '707', expense: '' },
    };

    report.revenues.forEach(r => {
      const code = codeMap[r.category]?.revenue || '707';
      lines.push(`BQ,${start},${code},${r.category},,${r.total}`);
    });
    report.expenses.forEach(e => {
      const code = codeMap[e.category]?.expense || '6XX';
      lines.push(`BQ,${start},${code},${e.category},${e.total},`);
    });
    return lines.join('\n');
  }
}