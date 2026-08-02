import { db } from '../db/connection.js';
import { matingServices } from '../db/schema/index.js';
import { animals } from '../db/schema/animals.js';
import { reproductionCycles } from '../db/schema/reproductionCycles.js';
import { eq, desc, and } from 'drizzle-orm';
import type { CreateMatingServiceInput, UpdateMatingServiceInput } from '../validators/matingValidator.js';

export const matingService = {
  // Créer une saillie
  async createService(data: CreateMatingServiceInput, userId: number) {
    // 1. Vérifier que l'animal (femelle) existe et est FEMALE
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, data.animalId));
    if (!animal) throw new Error('Animal non trouvé');
    if (animal.sex !== 'FEMALE') throw new Error('Seules les femelles peuvent avoir des saillies');

    // 2. Si un cycle est fourni, vérifier qu'il existe et appartient à cette femelle
    if (data.cycleId) {
      const [cycle] = await db
        .select()
        .from(reproductionCycles)
        .where(eq(reproductionCycles.id, data.cycleId));
      if (!cycle) throw new Error('Cycle non trouvé');
      if (cycle.animalId !== data.animalId) {
        throw new Error('Ce cycle n\'appartient pas à cette femelle');
      }
    }

    // 3. Si c'est une saillie naturelle, vérifier que le mâle existe et est MALE
    if (data.type === 'natural' && data.maleId) {
      const [male] = await db
        .select()
        .from(animals)
        .where(eq(animals.id, data.maleId));
      if (!male) throw new Error('Mâle non trouvé');
      if (male.sex !== 'MALE') throw new Error('Le mâle sélectionné n\'est pas de sexe MALE');
    }

    // 4. Si c'est une IA, une référence de semence est requise
    if (data.type === 'ai' && !data.semenReference) {
      throw new Error('La référence de semence est requise pour l\'insémination artificielle');
    }

    // 5. Calculer le numéro de service (1er, 2ème, etc.)
    const existingServices = await db
      .select()
      .from(matingServices)
      .where(
        and(
          eq(matingServices.animalId, data.animalId),
          data.cycleId ? eq(matingServices.cycleId, data.cycleId) : undefined
        )
      );
    const serviceNumber = existingServices.length + 1;

    // 6. Insérer
    const [result] = await db
      .insert(matingServices)
      .values({
        animalId: data.animalId,
        cycleId: data.cycleId || null,
        serviceDate: new Date(data.serviceDate),
        type: data.type,
        maleId: data.maleId || null,
        semenReference: data.semenReference || null,
        serviceNumber,
        result: data.result || 'pending',
        notes: data.notes || null,
        createdBy: userId,
      })
      .$returningId();
    const serviceId = result.id;
    return await this.getServiceById(serviceId);
  },

  // Récupérer toutes les saillies d'une femelle
  async getServicesByAnimalId(animalId: number) {
    return await db
      .select()
      .from(matingServices)
      .where(eq(matingServices.animalId, animalId))
      .orderBy(desc(matingServices.serviceDate));
  },

  // Récupérer les saillies d'un cycle spécifique
  async getServicesByCycleId(cycleId: number) {
    return await db
      .select()
      .from(matingServices)
      .where(eq(matingServices.cycleId, cycleId))
      .orderBy(desc(matingServices.serviceDate));
  },

  // Récupérer une saillie par son ID
  async getServiceById(id: number) {
    const [service] = await db
      .select()
      .from(matingServices)
      .where(eq(matingServices.id, id));
    return service;
  },

  // Mettre à jour une saillie
  async updateService(id: number, data: UpdateMatingServiceInput, userId: number) {
    const existing = await this.getServiceById(id);
    if (!existing) throw new Error('Saillie non trouvée');

    // ✅ On ne vérifie pas `type` car il n'est pas modifiable

    const updateData: any = {
      ...(data.serviceDate && { serviceDate: new Date(data.serviceDate) }),
      ...(data.maleId !== undefined && { maleId: data.maleId }),
      ...(data.semenReference !== undefined && { semenReference: data.semenReference }),
      ...(data.result && { result: data.result }),
      ...(data.notes !== undefined && { notes: data.notes }),
      updatedAt: new Date(),
    };

    await db
      .update(matingServices)
      .set(updateData)
      .where(eq(matingServices.id, id));

    return await this.getServiceById(id);
  },

  // Supprimer une saillie
  async deleteService(id: number) {
    const service = await this.getServiceById(id);
    if (!service) return null;
    await db
      .delete(matingServices)
      .where(eq(matingServices.id, id));
    return service;
  },
};