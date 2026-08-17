// backend/src/controllers/profitability.controller.ts

import { Context } from 'hono';
import { ProfitabilityService } from '../services/profitability.service.js';
import { profitabilityQuerySchema } from '../validators/profitability.validator.js';

const profitabilityService = new ProfitabilityService();

export const ProfitabilityController = {
  /**
   * GET /api/profitability/summary
   * Returns overall profitability for a given period.
   */
  async getProfitabilitySummary(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) {
      return c.json({ success: false, message: 'Non authentifié' }, 401);
    }

    const query = c.req.query();
    const result = profitabilityQuerySchema.safeParse(query);

    if (!result.success) {
      // ✅ Fix: use result.error.issues
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

    const { startDate, endDate } = result.data;

    try {
      const summary = await profitabilityService.getProfitabilitySummary(
        user.id,
        user.roleName || '',
        new Date(startDate),
        new Date(endDate)
      );
      return c.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('Erreur lors du calcul de la rentabilité:', error);
      return c.json({
        success: false,
        message: error.message || 'Erreur serveur',
      }, 500);
    }
  },

  /**
   * GET /api/profitability/animals
   * Returns profitability per animal (placeholder for now).
   */
  async getAnimalProfitability(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) {
      return c.json({ success: false, message: 'Non authentifié' }, 401);
    }

    const query = c.req.query();
    const result = profitabilityQuerySchema.safeParse(query);

    if (!result.success) {
      // ✅ Fix: use result.error.issues
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

    const { startDate, endDate, animalId } = result.data;

    try {
      const data = await profitabilityService.getAnimalProfitability(
        user.id,
        user.roleName || '',
        new Date(startDate),
        new Date(endDate),
        animalId
      );
      return c.json({ success: true, data });
    } catch (error: any) {
      console.error('Erreur lors du calcul de la rentabilité par animal:', error);
      return c.json({
        success: false,
        message: error.message || 'Erreur serveur',
      }, 500);
    }
  },
};