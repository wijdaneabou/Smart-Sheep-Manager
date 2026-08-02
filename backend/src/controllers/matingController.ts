import { Context } from 'hono';
import { matingService } from '../services/matingService.js';
import { createMatingServiceSchema, updateMatingServiceSchema } from '../validators/matingValidator.js';
import { fromZodError } from 'zod-validation-error';

export const matingController = {
  // POST /api/mating-services
  async createService(c: Context) {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Non autorisé' }, 401);

    const body = await c.req.json();
    const validation = createMatingServiceSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        { error: 'Données invalides', details: fromZodError(validation.error).message },
        400
      );
    }

    try {
      const service = await matingService.createService(validation.data, user.id);
      return c.json({ success: true, data: service }, 201);
    } catch (error: any) {
      const messages = [
        'Animal non trouvé',
        'Seules les femelles peuvent avoir des saillies',
        'Cycle non trouvé',
        'Ce cycle n\'appartient pas à cette femelle',
        'Mâle non trouvé',
        'Le mâle sélectionné n\'est pas de sexe MALE',
        'La référence de semence est requise pour l\'insémination artificielle',
      ];
      if (messages.includes(error.message)) {
        return c.json({ error: error.message }, 400);
      }
      console.error('Erreur création saillie:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }
  },

  // GET /api/mating-services/animal/:animalId
  async getServicesByAnimal(c: Context) {
    const animalId = Number(c.req.param('animalId'));
    if (isNaN(animalId) || animalId <= 0) {
      return c.json({ error: 'ID animal invalide' }, 400);
    }
    const services = await matingService.getServicesByAnimalId(animalId);
    return c.json({ success: true, data: services });
  },

  // GET /api/mating-services/cycle/:cycleId
  async getServicesByCycle(c: Context) {
    const cycleId = Number(c.req.param('cycleId'));
    if (isNaN(cycleId) || cycleId <= 0) {
      return c.json({ error: 'ID cycle invalide' }, 400);
    }
    const services = await matingService.getServicesByCycleId(cycleId);
    return c.json({ success: true, data: services });
  },

  // PATCH /api/mating-services/:id
  async updateService(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id) || id <= 0) return c.json({ error: 'ID invalide' }, 400);

    const body = await c.req.json();
    const validation = updateMatingServiceSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        { error: 'Données invalides', details: fromZodError(validation.error).message },
        400
      );
    }

    try {
      const updated = await matingService.updateService(id, validation.data, c.get('user').id);
      return c.json({ success: true, data: updated });
    } catch (error: any) {
      const messages = [
        'Saillie non trouvée',
        'Mâle non trouvé',
        'Le mâle sélectionné n\'est pas de sexe MALE',
      ];
      if (messages.includes(error.message)) {
        return c.json({ error: error.message }, 400);
      }
      console.error('Erreur mise à jour saillie:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }
  },

  // DELETE /api/mating-services/:id
  async deleteService(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id) || id <= 0) return c.json({ error: 'ID invalide' }, 400);

    const deleted = await matingService.deleteService(id);
    if (!deleted) return c.json({ error: 'Saillie non trouvée' }, 404);
    return c.json({ success: true, message: 'Saillie supprimée' });
  },
};