import { Context } from 'hono';
import { BudgetService } from '../services/budget.service.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  BUDGET_CATEGORIES,
} from '../validators/budget.validator.js';

const budgetService = new BudgetService();

export const BudgetController = {
  async getBudgets(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const query = c.req.query();
    const filters: { year?: number; month?: number; category?: string } = {};
    if (query.year) filters.year = parseInt(query.year);
    if (query.month !== undefined && query.month !== '') {
      const month = parseInt(query.month);
      if (!isNaN(month)) filters.month = month;
    }
    if (query.category && BUDGET_CATEGORIES.includes(query.category as any)) {
      filters.category = query.category;
    }

    try {
      const budgets = await budgetService.getBudgets(user.id, user.roleName || '', filters);
      return c.json({ success: true, data: budgets });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des budgets:', error);
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 500);
    }
  },

  async getBudgetById(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ success: false, message: 'ID manquant' }, 400);
    }
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID de budget invalide' }, 400);
    }

    try {
      const budget = await budgetService.getBudgetById(id, user.id, user.roleName || '');
      if (!budget) {
        return c.json({ success: false, message: 'Budget non trouvé ou accès non autorisé' }, 404);
      }
      return c.json({ success: true, data: budget });
    } catch (error: any) {
      console.error('Erreur lors de la récupération du budget:', error);
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 500);
    }
  },

  async createBudget(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const body = await c.req.json();
    try {
      const validated = createBudgetSchema.parse(body);
      const budget = await budgetService.createBudget(user.id, user.roleName || '', validated);
      return c.json({ success: true, data: budget }, 201);
    } catch (error: any) {
      console.error('Erreur lors de la création du budget:', error);
      if (error.errors) {
        return c.json({ success: false, message: 'Données invalides', errors: error.errors }, 400);
      }
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 400);
    }
  },

  async updateBudget(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ success: false, message: 'ID manquant' }, 400);
    }
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID de budget invalide' }, 400);
    }

    const body = await c.req.json();
    try {
      const validated = updateBudgetSchema.parse(body);
      const budget = await budgetService.updateBudget(id, user.id, user.roleName || '', validated);
      return c.json({ success: true, data: budget });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du budget:', error);
      if (error.errors) {
        return c.json({ success: false, message: 'Données invalides', errors: error.errors }, 400);
      }
      if (error.message === 'Budget non trouvé ou accès non autorisé') {
        return c.json({ success: false, message: error.message }, 404);
      }
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 400);
    }
  },

  async deleteBudget(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ success: false, message: 'ID manquant' }, 400);
    }
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID de budget invalide' }, 400);
    }

    try {
      await budgetService.deleteBudget(id, user.id, user.roleName || '');
      return c.json({ success: true, message: 'Budget supprimé avec succès' });
    } catch (error: any) {
      console.error('Erreur lors de la suppression du budget:', error);
      if (error.message === 'Budget non trouvé ou accès non autorisé') {
        return c.json({ success: false, message: error.message }, 404);
      }
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 400);
    }
  },

  async getBudgetSummary(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const yearParam = c.req.param('year');
    if (!yearParam) {
      return c.json({ success: false, message: 'Année manquante' }, 400);
    }
    const year = parseInt(yearParam);
    if (isNaN(year)) {
      return c.json({ success: false, message: 'Année invalide' }, 400);
    }

    try {
      const summary = await budgetService.getBudgetSummary(user.id, user.roleName || '', year);
      return c.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('Erreur lors de la récupération du résumé du budget:', error);
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 500);
    }
  },
};