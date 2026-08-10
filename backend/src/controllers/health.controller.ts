import { Context } from 'hono';
import { HealthService, type AnimalCarnet } from '../services/health.service.js';
import {
  createHealthRecordSchema,
  updateHealthRecordSchema,
  createTreatmentSchema,
  updateTreatmentSchema,
  createVaccinationSchema,
  updateVaccinationSchema,
  updateVaccinationStatusSchema,
  createInterventionSchema,
  updateInterventionSchema,
} from '../validators/health.validator.js';
import { db } from '../db/connection.js';
import { animals } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getUserExploitationIds } from '../utils/permissions.js';

const healthService = new HealthService();

// ─── Helper pour vérifier l'accès à un animal ───────────────────
async function checkAnimalAccess(animalId: number, userId: number, roleName: string): Promise<boolean> {
  const [animal] = await db
    .select({ exploitationId: animals.exploitationId })
    .from(animals)
    .where(eq(animals.id, animalId));
  if (!animal) return false;
  // ✅ Correction : gérer le cas où exploitationId est null
  if (animal.exploitationId === null) return false;
  const allowedIds = await getUserExploitationIds(userId, roleName);
  return allowedIds.includes(animal.exploitationId);
}

export const HealthController = {
  // ============================================
  // Health Records (US-5.1)
  // ============================================

  async getHealthRecords(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const animalIdParam = c.req.param('animalId');
    if (animalIdParam) {
      const animalId = Number(animalIdParam);
      if (isNaN(animalId)) {
        return c.json({ success: false, message: 'ID de l\'animal invalide' }, 400);
      }
      const hasAccess = await checkAnimalAccess(animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé à cet animal' }, 403);
      }
      const records = await healthService.getHealthRecords(animalId);
      return c.json({ success: true, data: records });
    } else {
      const allowedIds = await getUserExploitationIds(user.id, user.roleName || '');
      const records = await healthService.getAllHealthRecordsWithAnimals(allowedIds);
      return c.json({ success: true, data: records });
    }
  },

  async getLatestHealthRecord(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const animalId = Number(c.req.param('animalId'));
    if (isNaN(animalId)) {
      return c.json({ success: false, message: 'ID de l\'animal invalide' }, 400);
    }
    const hasAccess = await checkAnimalAccess(animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ success: false, message: 'Accès non autorisé à cet animal' }, 403);
    }
    const record = await healthService.getLatestHealthRecord(animalId);
    if (!record) {
      return c.json({ success: false, message: 'Aucun dossier médical trouvé pour cet animal' }, 404);
    }
    return c.json({ success: true, data: record });
  },

  async getHealthRecordById(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID du dossier invalide' }, 400);
    }
    const record = await healthService.getHealthRecordById(id);
    if (!record) {
      return c.json({ success: false, message: 'Dossier médical non trouvé' }, 404);
    }
    const hasAccess = await checkAnimalAccess(record.animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ success: false, message: 'Accès non autorisé' }, 403);
    }
    return c.json({ success: true, data: record });
  },

  async createHealthRecord(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const body = await c.req.json();
    try {
      const validated = createHealthRecordSchema.parse(body);
      const hasAccess = await checkAnimalAccess(validated.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé à cet animal' }, 403);
      }
      const recordedBy = user.id;
      const record = await healthService.createHealthRecord({ ...validated, recordedBy });
      return c.json({ success: true, data: record }, 201);
    } catch (error: any) {
      console.error('Erreur création dossier médical:', error);
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async updateHealthRecord(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID du dossier invalide' }, 400);
    }
    try {
      const existing = await healthService.getHealthRecordById(id);
      if (!existing) {
        return c.json({ success: false, message: 'Dossier médical non trouvé' }, 404);
      }
      const hasAccess = await checkAnimalAccess(existing.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }

      const validated = updateHealthRecordSchema.parse(body);
      const record = await healthService.updateHealthRecord(id, validated);
      if (!record) {
        return c.json({ success: false, message: 'Dossier médical non trouvé' }, 404);
      }
      return c.json({ success: true, data: record });
    } catch (error: any) {
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async deleteHealthRecord(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID du dossier invalide' }, 400);
    }
    try {
      const existing = await healthService.getHealthRecordById(id);
      if (!existing) {
        return c.json({ success: false, message: 'Dossier médical non trouvé' }, 404);
      }
      const hasAccess = await checkAnimalAccess(existing.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }
      await healthService.deleteHealthRecord(id);
      return c.json({ success: true, message: 'Dossier médical supprimé' });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur lors de la suppression' }, 400);
    }
  },

  // ============================================
  // Carnet sanitaire numérique (US-5.4)
  // ============================================

  async getCarnet(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const animalId = Number(c.req.param('animalId'));
    if (isNaN(animalId)) {
      return c.json({ success: false, message: "ID de l'animal invalide" }, 400);
    }
    const hasAccess = await checkAnimalAccess(animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ success: false, message: 'Accès non autorisé à cet animal' }, 403);
    }

    try {
      const carnet: AnimalCarnet = await healthService.getAnimalCarnet(animalId);
      return c.json({ success: true, data: carnet });
    } catch (error: any) {
      if (error.message === 'Animal non trouvé') {
        return c.json({ success: false, message: 'Animal non trouvé' }, 404);
      }
      return c.json({ success: false, message: 'Erreur lors du chargement du carnet sanitaire', errors: error.message }, 400);
    }
  },

  // ============================================
  // Treatments (US-5.2)
  // ============================================

  async getTreatmentsByHealthRecord(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const healthRecordId = Number(c.req.param('healthRecordId'));
    if (isNaN(healthRecordId)) {
      return c.json({ success: false, message: 'ID du dossier médical invalide' }, 400);
    }
    const record = await healthService.getHealthRecordById(healthRecordId);
    if (!record) {
      return c.json({ success: false, message: 'Dossier médical non trouvé' }, 404);
    }
    const hasAccess = await checkAnimalAccess(record.animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ success: false, message: 'Accès non autorisé' }, 403);
    }

    const treatments = await healthService.getTreatmentsByHealthRecord(healthRecordId);
    return c.json({ success: true, data: treatments });
  },

  async getTreatmentById(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID du traitement invalide' }, 400);
    }
    const treatment = await healthService.getTreatmentById(id);
    if (!treatment) {
      return c.json({ success: false, message: 'Traitement non trouvé' }, 404);
    }
    const record = await healthService.getHealthRecordById(treatment.healthRecordId);
    if (!record) {
      return c.json({ success: false, message: 'Dossier médical associé non trouvé' }, 404);
    }
    const hasAccess = await checkAnimalAccess(record.animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ success: false, message: 'Accès non autorisé' }, 403);
    }
    return c.json({ success: true, data: treatment });
  },

  async createTreatment(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const body = await c.req.json();
    try {
      const validated = createTreatmentSchema.parse(body);
      const healthRecord = await healthService.getHealthRecordById(validated.healthRecordId);
      if (!healthRecord) {
        return c.json({ success: false, message: 'Dossier médical non trouvé' }, 404);
      }
      const hasAccess = await checkAnimalAccess(healthRecord.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }

      const treatmentData = {
        ...validated,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
        nextDoseDate: validated.nextDoseDate ? new Date(validated.nextDoseDate) : undefined,
      };

      const treatment = await healthService.createTreatment(treatmentData);
      return c.json({ success: true, data: treatment }, 201);
    } catch (error: any) {
      console.error('Erreur création traitement:', error);
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async updateTreatment(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID du traitement invalide' }, 400);
    }
    try {
      const existing = await healthService.getTreatmentById(id);
      if (!existing) {
        return c.json({ success: false, message: 'Traitement non trouvé' }, 404);
      }
      const record = await healthService.getHealthRecordById(existing.healthRecordId);
      if (!record) {
        return c.json({ success: false, message: 'Dossier médical associé non trouvé' }, 404);
      }
      const hasAccess = await checkAnimalAccess(record.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }

      const validated = updateTreatmentSchema.parse(body);
      const treatmentData: any = { ...validated };
      if (validated.startDate !== undefined) {
        treatmentData.startDate = new Date(validated.startDate);
      }
      if (validated.endDate !== undefined) {
        treatmentData.endDate = validated.endDate ? new Date(validated.endDate) : null;
      }
      if (validated.nextDoseDate !== undefined) {
        treatmentData.nextDoseDate = validated.nextDoseDate ? new Date(validated.nextDoseDate) : null;
      }

      const treatment = await healthService.updateTreatment(id, treatmentData);
      return c.json({ success: true, data: treatment });
    } catch (error: any) {
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async administerTreatment(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID du traitement invalide' }, 400);
    }
    try {
      const existing = await healthService.getTreatmentById(id);
      if (!existing) {
        return c.json({ success: false, message: 'Traitement non trouvé' }, 404);
      }
      const record = await healthService.getHealthRecordById(existing.healthRecordId);
      if (!record) {
        return c.json({ success: false, message: 'Dossier médical associé non trouvé' }, 404);
      }
      const hasAccess = await checkAnimalAccess(record.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }

      const isAlreadyAdministered = existing.administered === true;
      if (isAlreadyAdministered) {
        return c.json({ success: false, message: 'Ce traitement a déjà été administré' }, 400);
      }
      const treatment = await healthService.administerTreatment(id, user.id);
      return c.json({ success: true, data: treatment });
    } catch (error: any) {
      return c.json({ success: false, message: 'Erreur lors de l\'administration', errors: error.message }, 400);
    }
  },

  async deleteTreatment(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID du traitement invalide' }, 400);
    }
    try {
      const existing = await healthService.getTreatmentById(id);
      if (!existing) {
        return c.json({ success: false, message: 'Traitement non trouvé' }, 404);
      }
      const record = await healthService.getHealthRecordById(existing.healthRecordId);
      if (!record) {
        return c.json({ success: false, message: 'Dossier médical associé non trouvé' }, 404);
      }
      const hasAccess = await checkAnimalAccess(record.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }
      await healthService.deleteTreatment(id);
      return c.json({ success: true, message: 'Traitement supprimé avec succès' });
    } catch (error: any) {
      return c.json({ success: false, message: 'Erreur lors de la suppression', errors: error.message }, 400);
    }
  },

  // ============================================
  // Vaccinations (US-5.3)
  // ============================================

  async getVaccinationsByAnimal(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const animalId = Number(c.req.param('animalId'));
    if (isNaN(animalId)) {
      return c.json({ success: false, message: 'ID de l\'animal invalide' }, 400);
    }
    const hasAccess = await checkAnimalAccess(animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ success: false, message: 'Accès non autorisé à cet animal' }, 403);
    }
    const allowedIds = await getUserExploitationIds(user.id, user.roleName || '');
    const vaccinations = await healthService.getVaccinationsByAnimal(animalId, allowedIds);
    return c.json({ success: true, data: vaccinations });
  },

  async getVaccinationById(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID de la vaccination invalide' }, 400);
    }
    const vaccination = await healthService.getVaccinationById(id);
    if (!vaccination) {
      return c.json({ success: false, message: 'Vaccination non trouvée' }, 404);
    }
    const hasAccess = await checkAnimalAccess(vaccination.animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ success: false, message: 'Accès non autorisé' }, 403);
    }
    return c.json({ success: true, data: vaccination });
  },

  async createVaccination(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const body = await c.req.json();
    try {
      const validated = createVaccinationSchema.parse(body);
      const hasAccess = await checkAnimalAccess(validated.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé à cet animal' }, 403);
      }

      const vaccinationData = {
        ...validated,
        date: new Date(validated.date),
        boosterDate: validated.boosterDate ? new Date(validated.boosterDate) : undefined,
        administeredBy: user.id,
        status: 'PENDING',
      };

      const vaccination = await healthService.createVaccination(vaccinationData);
      return c.json({ success: true, data: vaccination }, 201);
    } catch (error: any) {
      console.error('Erreur création vaccination:', error);
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async updateVaccination(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID de la vaccination invalide' }, 400);
    }
    try {
      const existing = await healthService.getVaccinationById(id);
      if (!existing) {
        return c.json({ success: false, message: 'Vaccination non trouvée' }, 404);
      }
      const hasAccess = await checkAnimalAccess(existing.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }

      const validated = updateVaccinationSchema.parse(body);
      const vaccinationData: any = { ...validated };
      if (validated.date !== undefined) {
        vaccinationData.date = new Date(validated.date);
      }
      if (validated.boosterDate !== undefined) {
        vaccinationData.boosterDate = validated.boosterDate ? new Date(validated.boosterDate) : null;
      }

      const vaccination = await healthService.updateVaccination(id, vaccinationData);
      return c.json({ success: true, data: vaccination });
    } catch (error: any) {
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async updateVaccinationStatus(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID de la vaccination invalide' }, 400);
    }
    try {
      const existing = await healthService.getVaccinationById(id);
      if (!existing) {
        return c.json({ success: false, message: 'Vaccination non trouvée' }, 404);
      }
      const hasAccess = await checkAnimalAccess(existing.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }

      const validated = updateVaccinationStatusSchema.parse(body);
      const vaccination = await healthService.updateVaccinationStatus(id, validated.status, user.id);
      return c.json({ success: true, data: vaccination });
    } catch (error: any) {
      return c.json({ success: false, message: 'Erreur lors de la mise à jour du statut', errors: error.message }, 400);
    }
  },

  async deleteVaccination(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID de la vaccination invalide' }, 400);
    }
    try {
      const existing = await healthService.getVaccinationById(id);
      if (!existing) {
        return c.json({ success: false, message: 'Vaccination non trouvée' }, 404);
      }
      const hasAccess = await checkAnimalAccess(existing.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }
      await healthService.deleteVaccination(id);
      return c.json({ success: true, message: 'Vaccination supprimée avec succès' });
    } catch (error: any) {
      return c.json({ success: false, message: 'Erreur lors de la suppression', errors: error.message }, 400);
    }
  },

  // ============================================
  // US-5.6: Rapport sanitaire
  // ============================================

  async getHealthReport(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    try {
      const allowedIds = await getUserExploitationIds(user.id, user.roleName || '');
      const report = await healthService.getHealthReport(allowedIds);
      return c.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Erreur lors de la génération du rapport sanitaire:', error);
      return c.json({
        success: false,
        message: error.message || 'Erreur lors de la génération du rapport',
      }, 500);
    }
  },

  // ============================================
  // US-5.7: Interventions vétérinaires
  // ============================================

  async getInterventionsByAnimal(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const animalId = Number(c.req.param('animalId'));
    if (isNaN(animalId)) {
      return c.json({ success: false, message: 'ID de l\'animal invalide' }, 400);
    }
    const hasAccess = await checkAnimalAccess(animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ success: false, message: 'Accès non autorisé à cet animal' }, 403);
    }
    const allowedIds = await getUserExploitationIds(user.id, user.roleName || '');
    const interventions = await healthService.getInterventionsByAnimal(animalId, allowedIds);
    return c.json({ success: true, data: interventions });
  },

  async getInterventionById(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID de l\'intervention invalide' }, 400);
    }
    const intervention = await healthService.getInterventionById(id);
    if (!intervention) {
      return c.json({ success: false, message: 'Intervention non trouvée' }, 404);
    }
    const hasAccess = await checkAnimalAccess(intervention.animalId, user.id, user.roleName || '');
    if (!hasAccess) {
      return c.json({ success: false, message: 'Accès non autorisé' }, 403);
    }
    return c.json({ success: true, data: intervention });
  },

  async createIntervention(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const body = await c.req.json();
    try {
      const validated = createInterventionSchema.parse(body);
      const hasAccess = await checkAnimalAccess(validated.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé à cet animal' }, 403);
      }

      const interventionData = {
        ...validated,
        date: new Date(validated.date),
        performedBy: user.id,
      };

      const intervention = await healthService.createIntervention(interventionData);
      return c.json({ success: true, data: intervention }, 201);
    } catch (error: any) {
      console.error('Erreur création intervention:', error);
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async updateIntervention(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID de l\'intervention invalide' }, 400);
    }
    try {
      const existing = await healthService.getInterventionById(id);
      if (!existing) {
        return c.json({ success: false, message: 'Intervention non trouvée' }, 404);
      }
      const hasAccess = await checkAnimalAccess(existing.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }

      const validated = updateInterventionSchema.parse(body);
      const interventionData: any = { ...validated };
      if (validated.date !== undefined) {
        interventionData.date = new Date(validated.date);
      }

      const intervention = await healthService.updateIntervention(id, interventionData);
      return c.json({ success: true, data: intervention });
    } catch (error: any) {
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async deleteIntervention(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string } | undefined;
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID de l\'intervention invalide' }, 400);
    }
    try {
      const existing = await healthService.getInterventionById(id);
      if (!existing) {
        return c.json({ success: false, message: 'Intervention non trouvée' }, 404);
      }
      const hasAccess = await checkAnimalAccess(existing.animalId, user.id, user.roleName || '');
      if (!hasAccess) {
        return c.json({ success: false, message: 'Accès non autorisé' }, 403);
      }
      await healthService.deleteIntervention(id);
      return c.json({ success: true, message: 'Intervention supprimée avec succès' });
    } catch (error: any) {
      return c.json({ success: false, message: 'Erreur lors de la suppression', errors: error.message }, 400);
    }
  },
};