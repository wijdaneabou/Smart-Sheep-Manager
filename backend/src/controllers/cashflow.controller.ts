// backend/src/controllers/cashflow.controller.ts

import { Context } from 'hono';
import { CashflowService } from '../services/cashflow.service.js';
import { cashflowQuerySchema } from '../validators/cashflow.validator.js';

const cashflowService = new CashflowService();

export const CashflowController = {
  async getCashflow(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) {
      return c.json({ success: false, message: 'Non authentifié' }, 401);
    }

    const query = c.req.query();
    const result = cashflowQuerySchema.safeParse(query);

    if (!result.success) {
      // ✅ Correct Zod error handling
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return c.json({
        success: false,
        message: 'Paramètres invalides',
        errors,
      }, 400);
    }

    const { startDate, endDate, months } = result.data;

    try {
      if (startDate && endDate) {
        const actual = await cashflowService.getActualCashflow(
          user.id,
          user.roleName || '',
          new Date(startDate),
          new Date(endDate)
        );
        return c.json({ success: true, data: { actual } });
      }

      const full = await cashflowService.getFullCashflow(
        user.id,
        user.roleName || '',
        months || 3
      );
      return c.json({ success: true, data: full });
    } catch (error: any) {
      console.error('Erreur lors de la récupération du cashflow:', error);
      return c.json({
        success: false,
        message: error.message || 'Erreur serveur',
      }, 500);
    }
  },

  async getCashflowSummary(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) {
      return c.json({ success: false, message: 'Non authentifié' }, 401);
    }

    try {
      const summary = await cashflowService.getCashflowSummary(user.id, user.roleName || '');
      return c.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('Erreur lors de la récupération du résumé cashflow:', error);
      return c.json({
        success: false,
        message: error.message || 'Erreur serveur',
      }, 500);
    }
  },

  async getCashflowProjection(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) {
      return c.json({ success: false, message: 'Non authentifié' }, 401);
    }

    const query = c.req.query();
    const result = cashflowQuerySchema.safeParse(query);

    if (!result.success) {
      // ✅ Correct Zod error handling
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return c.json({
        success: false,
        message: 'Paramètres invalides',
        errors,
      }, 400);
    }

    const { months } = result.data;

    try {
      const projection = await cashflowService.getCashflowProjection(
        user.id,
        user.roleName || '',
        months || 3
      );
      return c.json({ success: true, data: projection });
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la projection cashflow:', error);
      return c.json({
        success: false,
        message: error.message || 'Erreur serveur',
      }, 500);
    }
  },
};