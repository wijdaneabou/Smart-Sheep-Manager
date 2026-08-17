// backend/src/controllers/cost.controller.ts

import { Context } from 'hono';
import { CostService } from '../services/cost.service.js';
import { costQuerySchema } from '../validators/cost.validator.js';

const costService = new CostService();

export const CostController = {
  async getCostOfProduction(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) {
      return c.json({ success: false, message: 'Non authentifié' }, 401);
    }

    const query = c.req.query();
    const result = costQuerySchema.safeParse(query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return c.json({ success: false, message: 'Paramètres invalides', errors }, 400);
    }

    const { startDate, endDate } = result.data;
    try {
      const costData = await costService.getCostOfProduction(
        user.id,
        user.roleName || '',
        new Date(startDate),
        new Date(endDate)
      );
      return c.json({ success: true, data: costData });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 500);
    }
  },
};