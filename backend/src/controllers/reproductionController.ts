import { Context } from 'hono';
import { reproductionService } from '../services/reproductionService.js';
import { createReproductionCycleSchema, updatePregnancyConfirmationSchema } from '../validators/reproductionValidator.js';
import { updatePregnancySchema } from '../validators/pregnancyValidator.js';
import { lambingSchema } from '../validators/lambingValidator.js';
import { fromZodError } from 'zod-validation-error';
import { getUserExploitationIds } from '../utils/permissions.js'; 
import { db } from '../db/connection.js';
import { animals } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

// ─── Helper pour vérifier l'accès à un animal ───────────────────
async function checkAnimalAccess(animalId: number, userId: number, roleName: string): Promise<boolean> {
  const [animal] = await db
    .select({ exploitationId: animals.exploitationId })
    .from(animals)
    .where(eq(animals.id, animalId));
  if (!animal) return false;
  if (animal.exploitationId === null) return false;
  const allowedIds = await getUserExploitationIds(userId, roleName);
  return allowedIds.includes(animal.exploitationId);
}

export const reproductionController = {
  // ─── CREATE CYCLE ──────────────────────────────────────────────
  async createCycle(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ error: 'Non autorisé' }, 401);

    const body = await c.req.json();
    const validation = createReproductionCycleSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        { error: 'Données invalides', details: fromZodError(validation.error).message },
        400
      );
    }

    // Vérifier l'accès à l'animal
    const hasAccess = await checkAnimalAccess(validation.data.animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ error: 'Accès non autorisé à cet animal' }, 403);
    }

    try {
      const newCycle = await reproductionService.createCycle(validation.data, user.id);
      return c.json({ success: true, data: newCycle }, 201);
    } catch (error: any) {
      if (error.message === 'Seules les femelles peuvent avoir des cycles de reproduction' ||
          error.message === 'Animal non trouvé') {
        return c.json({ error: error.message }, 400);
      }
      console.error('Erreur création cycle:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }
  },

  // ─── GET CYCLES BY ANIMAL ──────────────────────────────────────
  async getCyclesByAnimal(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ error: 'Non autorisé' }, 401);

    const animalId = Number(c.req.param('animalId'));
    if (isNaN(animalId) || animalId <= 0) {
      return c.json({ error: 'ID animal invalide' }, 400);
    }

    // Vérifier l'accès à l'animal
    const hasAccess = await checkAnimalAccess(animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ error: 'Accès non autorisé à cet animal' }, 403);
    }

    const cycles = await reproductionService.getCyclesByAnimalId(animalId);
    return c.json({ success: true, data: cycles });
  },

  // ─── CONFIRM PREGNANCY ──────────────────────────────────────────
  async confirmPregnancy(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ error: 'Non autorisé' }, 401);

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

    // Vérifier l'accès via le cycle
    const cycle = await reproductionService.getCycleById(id);
    if (!cycle) return c.json({ error: 'Cycle non trouvé' }, 404);
    const hasAccess = await checkAnimalAccess(cycle.animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }

    const updated = await reproductionService.confirmPregnancy(id, validation.data.confirmationDate);
    if (!updated) return c.json({ error: 'Cycle non trouvé' }, 404);
    return c.json({ success: true, data: updated });
  },

  // ─── DELETE CYCLE ──────────────────────────────────────────────
  async deleteCycle(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ error: 'Non autorisé' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id) || id <= 0) return c.json({ error: 'ID cycle invalide' }, 400);

    // Vérifier l'accès via le cycle
    const cycle = await reproductionService.getCycleById(id);
    if (!cycle) return c.json({ error: 'Cycle non trouvé' }, 404);
    const hasAccess = await checkAnimalAccess(cycle.animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }

    const deleted = await reproductionService.deleteCycle(id);
    if (!deleted) return c.json({ error: 'Cycle non trouvé' }, 404);
    return c.json({ success: true, message: 'Cycle supprimé' });
  },

  // ─── UPDATE PREGNANCY ──────────────────────────────────────────
  async updatePregnancy(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ error: 'Non autorisé' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id) || id <= 0) return c.json({ error: 'ID cycle invalide' }, 400);

    const body = await c.req.json();
    const validation = updatePregnancySchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        { error: 'Données invalides', details: fromZodError(validation.error).message },
        400
      );
    }

    // Vérifier l'accès via le cycle
    const cycle = await reproductionService.getCycleById(id);
    if (!cycle) return c.json({ error: 'Cycle non trouvé' }, 404);
    const hasAccess = await checkAnimalAccess(cycle.animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }

    try {
      const updated = await reproductionService.updatePregnancy(id, validation.data);
      return c.json({ success: true, data: updated });
    } catch (error: any) {
      if (error.message === 'Cycle non trouvé' || error.message === 'Impossible de mettre à jour la gestation : cycle non confirmé') {
        return c.json({ error: error.message }, 400);
      }
      console.error('Erreur mise à jour gestation:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }
  },

  // ─── RECORD LAMBING (US‑6.4) ──────────────────────────────────
  async recordLambing(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ error: 'Non autorisé' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id) || id <= 0) return c.json({ error: 'ID cycle invalide' }, 400);

    const body = await c.req.json();
    const validation = lambingSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        { error: 'Données invalides', details: fromZodError(validation.error).message },
        400
      );
    }

    // Vérifier l'accès via le cycle
    const cycle = await reproductionService.getCycleById(id);
    if (!cycle) return c.json({ error: 'Cycle non trouvé' }, 404);
    const hasAccess = await checkAnimalAccess(cycle.animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }

    try {
      const result = await reproductionService.recordLambing(id, validation.data, user.id);
      return c.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'Cycle non trouvé' || error.message === 'Impossible d\'enregistrer une mise bas : la gestation n\'est pas confirmée') {
        return c.json({ error: error.message }, 400);
      }
      console.error('Erreur enregistrement mise bas:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }
  },

  // ─── PERFORMANCE INDIVIDUELLE (US‑6.5) ──────────────────────
  async getPerformance(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ error: 'Non autorisé' }, 401);

    const animalId = Number(c.req.param('animalId'));
    if (isNaN(animalId) || animalId <= 0) {
      return c.json({ error: 'ID animal invalide' }, 400);
    }

    // Vérifier l'accès à l'animal
    const hasAccess = await checkAnimalAccess(animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ error: 'Accès non autorisé à cet animal' }, 403);
    }

    try {
      const performance = await reproductionService.getReproductivePerformance(animalId);
      return c.json({ success: true, data: performance });
    } catch (error) {
      console.error('Erreur récupération performance:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }
  },

  // ─── PERFORMANCE TROUPEAU (US‑6.5) ──────────────────────────
  async getHerdPerformance(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ error: 'Non autorisé' }, 401);

    const exploitationId = Number(c.req.param('exploitationId'));
    if (isNaN(exploitationId) || exploitationId <= 0) {
      return c.json({ error: 'ID exploitation invalide' }, 400);
    }

    // Vérifier que l'utilisateur a accès à cette exploitation
    const allowedIds = await getUserExploitationIds(user.id, user.roleName || '');
    if (!allowedIds.includes(exploitationId)) {
      return c.json({ error: 'Accès non autorisé à cette exploitation' }, 403);
    }

    try {
      const performance = await reproductionService.getHerdPerformance(exploitationId);
      return c.json({ success: true, data: performance });
    } catch (error) {
      console.error('Erreur récupération performance troupeau:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }
  },
};