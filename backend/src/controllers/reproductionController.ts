import { Context } from 'hono';
import { reproductionService } from '../services/reproductionService.js';
import { createReproductionCycleSchema, updatePregnancyConfirmationSchema } from '../validators/reproductionValidator.js';
import { fromZodError } from 'zod-validation-error';

export const reproductionController = {
  async createCycle(c: Context) {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Non autorisé' }, 401);

    const body = await c.req.json();
    const validation = createReproductionCycleSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        { error: 'Données invalides', details: fromZodError(validation.error).message },
        400
      );
    }

    try {
      const newCycle = await reproductionService.createCycle(validation.data, user.id);
      return c.json({ success: true, data: newCycle }, 201);
    } catch (error: any) {
      // ✅ Gestion des erreurs métier
      if (error.message === 'Seules les femelles peuvent avoir des cycles de reproduction' ||
          error.message === 'Animal non trouvé') {
        return c.json({ error: error.message }, 400);
      }
      console.error('Erreur création cycle:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }
  },

  // ... autres méthodes inchangées (getCyclesByAnimal, confirmPregnancy, deleteCycle)
  async getCyclesByAnimal(c: Context) {
    const animalId = Number(c.req.param('animalId'));
    if (isNaN(animalId) || animalId <= 0) {
      return c.json({ error: 'ID animal invalide' }, 400);
    }
    const cycles = await reproductionService.getCyclesByAnimalId(animalId);
    return c.json({ success: true, data: cycles });
  },

  async confirmPregnancy(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id) || id <= 0) return c.json({ error: 'ID cycle invalide' }, 400);
    const body = await c.req.json();
    const validation = updatePregnancyConfirmationSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        { error: 'Données invalides', details: fromZodError(validation.error).message },
        400
      );
    }
    const updated = await reproductionService.confirmPregnancy(id, validation.data.confirmationDate);
    if (!updated) return c.json({ error: 'Cycle non trouvé' }, 404);
    return c.json({ success: true, data: updated });
  },

  async deleteCycle(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id) || id <= 0) return c.json({ error: 'ID cycle invalide' }, 400);
    const deleted = await reproductionService.deleteCycle(id);
    if (!deleted) return c.json({ error: 'Cycle non trouvé' }, 404);
    return c.json({ success: true, message: 'Cycle supprimé' });
  },
};