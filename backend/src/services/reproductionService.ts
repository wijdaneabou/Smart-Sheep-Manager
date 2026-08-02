import { db } from '../db/connection.js';
import { reproductionCycles } from '../db/schema/index.js';
import { animals } from '../db/schema/animals.js';  // ⬅️ Ajout
import { eq, desc } from 'drizzle-orm';
import type { CreateReproductionCycleInput } from '../validators/reproductionValidator.js';

export const reproductionService = {
  async createCycle(data: CreateReproductionCycleInput, userId: number) {
    // ✅ Vérification que l'animal existe et est une femelle
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, data.animalId));

    if (!animal) {
      throw new Error('Animal non trouvé');
    }
    if (animal.sex !== 'FEMALE') {
      throw new Error('Seules les femelles peuvent avoir des cycles de reproduction');
    }

    // Le reste est inchangé
    const [result] = await db
      .insert(reproductionCycles)
      .values({
        animalId: data.animalId,
        heatDate: new Date(data.heatDate),
        matingType: data.matingType,
        maleId: data.maleId || null,
        semenReference: data.semenReference || null,
        notes: data.notes || null,
        createdBy: userId,
        pregnancyConfirmed: false,
      })
      .$returningId();
    const cycleId = result.id;
    return await this.getCycleById(cycleId);
  },

  // ... autres méthodes inchangées (getCyclesByAnimalId, getCycleById, confirmPregnancy, deleteCycle)
  async getCyclesByAnimalId(animalId: number) {
    return await db
      .select()
      .from(reproductionCycles)
      .where(eq(reproductionCycles.animalId, animalId))
      .orderBy(desc(reproductionCycles.heatDate));
  },

  async getCycleById(id: number) {
    const [cycle] = await db
      .select()
      .from(reproductionCycles)
      .where(eq(reproductionCycles.id, id));
    return cycle;
  },

  async confirmPregnancy(id: number, confirmationDate: string) {
    const cycle = await this.getCycleById(id);
    if (!cycle) return null;
    await db
      .update(reproductionCycles)
      .set({
        pregnancyConfirmed: true,
        confirmationDate: new Date(confirmationDate),
      })
      .where(eq(reproductionCycles.id, id));
    return await this.getCycleById(id);
  },

  async deleteCycle(id: number) {
    const cycle = await this.getCycleById(id);
    if (!cycle) return null;
    await db
      .delete(reproductionCycles)
      .where(eq(reproductionCycles.id, id));
    return cycle;
  },
};