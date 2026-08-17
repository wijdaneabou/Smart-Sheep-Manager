// backend/src/controllers/expense.controller.ts

import { Context } from 'hono';
import { ExpenseService } from '../services/expense.service.js';
import { createExpenseSchema, updateExpenseSchema } from '../validators/expense.validator.js';

const expenseService = new ExpenseService();

export const ExpenseController = {
  async getExpenses(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const query = c.req.query();
    const filters: any = {};
    if (query.startDate) filters.startDate = new Date(query.startDate);
    if (query.endDate) filters.endDate = new Date(query.endDate);
    if (query.category) filters.category = query.category;

    try {
      const expenses = await expenseService.getExpenses(user.id, user.roleName || '', filters);
      return c.json({ success: true, data: expenses });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 500);
    }
  },

  async getExpenseById(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ success: false, message: 'ID manquant' }, 400);
    }
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }

    try {
      const expense = await expenseService.getExpenseById(id, user.id, user.roleName || '');
      if (!expense) {
        return c.json({ success: false, message: 'Dépense non trouvée' }, 404);
      }
      return c.json({ success: true, data: expense });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 500);
    }
  },

  async createExpense(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const body = await c.req.json();
    try {
      const validated = createExpenseSchema.parse(body);
      // Build data with proper types
      const data: any = {
        exploitationId: validated.exploitationId,
        amount: validated.amount,
        category: validated.category,
        paymentMethod: validated.paymentMethod,
        beneficiary: validated.beneficiary || null,
        notes: validated.notes || null,
        justification: validated.justification || null,
      };
      if (validated.date) {
        data.date = new Date(validated.date);
      } else {
        data.date = new Date(); // default to now if not provided (though schema has default, but let's be explicit)
      }
      const expense = await expenseService.createExpense(user.id, user.roleName || '', data);
      return c.json({ success: true, data: expense }, 201);
    } catch (error: any) {
      if (error.errors) {
        return c.json({ success: false, message: 'Données invalides', errors: error.errors }, 400);
      }
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 400);
    }
  },

  async updateExpense(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ success: false, message: 'ID manquant' }, 400);
    }
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }

    const body = await c.req.json();
    try {
      const validated = updateExpenseSchema.parse(body);
      const data: any = {};
      if (validated.exploitationId !== undefined) data.exploitationId = validated.exploitationId;
      if (validated.amount !== undefined) data.amount = validated.amount;
      if (validated.category !== undefined) data.category = validated.category;
      if (validated.paymentMethod !== undefined) data.paymentMethod = validated.paymentMethod;
      if (validated.beneficiary !== undefined) data.beneficiary = validated.beneficiary;
      if (validated.notes !== undefined) data.notes = validated.notes;
      if (validated.justification !== undefined) data.justification = validated.justification;
      if (validated.date !== undefined) {
        data.date = validated.date ? new Date(validated.date) : null;
      }
      const expense = await expenseService.updateExpense(id, user.id, user.roleName || '', data);
      return c.json({ success: true, data: expense });
    } catch (error: any) {
      if (error.errors) {
        return c.json({ success: false, message: 'Données invalides', errors: error.errors }, 400);
      }
      if (error.message === 'Dépense non trouvée ou accès non autorisé') {
        return c.json({ success: false, message: error.message }, 404);
      }
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 400);
    }
  },

  async deleteExpense(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ success: false, message: 'ID manquant' }, 400);
    }
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }

    try {
      await expenseService.deleteExpense(id, user.id, user.roleName || '');
      return c.json({ success: true, message: 'Dépense supprimée' });
    } catch (error: any) {
      if (error.message === 'Dépense non trouvée ou accès non autorisé') {
        return c.json({ success: false, message: error.message }, 404);
      }
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 400);
    }
  },
};