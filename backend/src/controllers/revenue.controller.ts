// backend/src/controllers/revenue.controller.ts

import { Context } from 'hono';
import { RevenueService } from '../services/revenue.service.js';
import { createRevenueSchema, updateRevenueSchema } from '../validators/revenue.validator.js';

const revenueService = new RevenueService();

export const RevenueController = {
  async getRevenues(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const query = c.req.query();
    const filters: any = {};
    if (query.startDate) filters.startDate = new Date(query.startDate);
    if (query.endDate) filters.endDate = new Date(query.endDate);
    if (query.type) filters.type = query.type;

    try {
      const revenues = await revenueService.getRevenues(user.id, user.roleName || '', filters);
      return c.json({ success: true, data: revenues });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 500);
    }
  },

  async getRevenueById(c: Context) {
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
      const revenue = await revenueService.getRevenueById(id, user.id, user.roleName || '');
      if (!revenue) {
        return c.json({ success: false, message: 'Revenu non trouvé' }, 404);
      }
      return c.json({ success: true, data: revenue });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 500);
    }
  },

  async createRevenue(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const body = await c.req.json();
    try {
      const validated = createRevenueSchema.parse(body);

      // Build the data object with correct types
      const data: any = {
        exploitationId: validated.exploitationId,
        type: validated.type,
        totalHT: validated.totalHT,
        totalTTC: validated.totalTTC,
        buyer: validated.buyer || null,
        paymentMethod: validated.paymentMethod || 'CASH',
        status: validated.status || 'PENDING',
        notes: validated.notes || null,
      };

      // Convert date string to Date if present
      if (validated.date) {
        data.date = new Date(validated.date);
      }

      // Convert numeric quantity and unitPrice to strings (for Drizzle decimal)
      if (validated.quantity !== undefined && validated.quantity !== null) {
        data.quantity = String(validated.quantity);
      }
      if (validated.unitPrice !== undefined && validated.unitPrice !== null) {
        data.unitPrice = String(validated.unitPrice);
      }

      const revenue = await revenueService.createRevenue(user.id, user.roleName || '', data);
      return c.json({ success: true, data: revenue }, 201);
    } catch (error: any) {
      if (error.errors) {
        return c.json({ success: false, message: 'Données invalides', errors: error.errors }, 400);
      }
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 400);
    }
  },

  async updateRevenue(c: Context) {
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
      const validated = updateRevenueSchema.parse(body);

      // Build the data object
      const data: any = {};

      if (validated.exploitationId !== undefined) data.exploitationId = validated.exploitationId;
      if (validated.type !== undefined) data.type = validated.type;
      if (validated.totalHT !== undefined) data.totalHT = validated.totalHT;
      if (validated.totalTTC !== undefined) data.totalTTC = validated.totalTTC;
      if (validated.buyer !== undefined) data.buyer = validated.buyer;
      if (validated.paymentMethod !== undefined) data.paymentMethod = validated.paymentMethod;
      if (validated.status !== undefined) data.status = validated.status;
      if (validated.notes !== undefined) data.notes = validated.notes;

      if (validated.date !== undefined) {
        data.date = validated.date ? new Date(validated.date) : null;
      }
      if (validated.quantity !== undefined && validated.quantity !== null) {
        data.quantity = String(validated.quantity);
      } else if (validated.quantity === null) {
        data.quantity = null;
      }
      if (validated.unitPrice !== undefined && validated.unitPrice !== null) {
        data.unitPrice = String(validated.unitPrice);
      } else if (validated.unitPrice === null) {
        data.unitPrice = null;
      }

      const revenue = await revenueService.updateRevenue(id, user.id, user.roleName || '', data);
      return c.json({ success: true, data: revenue });
    } catch (error: any) {
      if (error.errors) {
        return c.json({ success: false, message: 'Données invalides', errors: error.errors }, 400);
      }
      if (error.message === 'Revenu non trouvé ou accès non autorisé') {
        return c.json({ success: false, message: error.message }, 404);
      }
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 400);
    }
  },

  async deleteRevenue(c: Context) {
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
      await revenueService.deleteRevenue(id, user.id, user.roleName || '');
      return c.json({ success: true, message: 'Revenu supprimé' });
    } catch (error: any) {
      if (error.message === 'Revenu non trouvé ou accès non autorisé') {
        return c.json({ success: false, message: error.message }, 404);
      }
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 400);
    }
  },
};