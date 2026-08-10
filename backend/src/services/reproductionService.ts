import { db } from '../db/connection.js';
import { reproductionCycles } from '../db/schema/index.js';
import { animals } from '../db/schema/animals.js';
import { eq, desc, and } from 'drizzle-orm';
import type { CreateReproductionCycleInput } from '../validators/reproductionValidator.js';
import type { UpdatePregnancyInput } from '../validators/pregnancyValidator.js';
import type { LambingInput } from '../validators/lambingValidator.js';
import { matingService } from './matingService.js';

export const reproductionService = {
  async createCycle(data: CreateReproductionCycleInput, userId: number) {
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

  async updatePregnancy(cycleId: number, data: UpdatePregnancyInput) {
    const cycle = await this.getCycleById(cycleId);
    if (!cycle) throw new Error('Cycle non trouvé');
    if (!cycle.pregnancyConfirmed) {
      throw new Error('Impossible de mettre à jour la gestation : cycle non confirmé');
    }

    const updateData: any = {};
    if (data.expectedLambingDate) {
      updateData.expectedLambingDate = new Date(data.expectedLambingDate);
    }
    if (data.ultrasoundNotes !== undefined) {
      updateData.ultrasoundNotes = data.ultrasoundNotes;
    }
    if (data.lambingDate) {
      updateData.lambingDate = new Date(data.lambingDate);
    }
    if (data.lambingType) {
      updateData.lambingType = data.lambingType;
    }
    if (data.liveBorn !== undefined) {
      updateData.liveBorn = data.liveBorn;
    }
    if (data.stillBorn !== undefined) {
      updateData.stillBorn = data.stillBorn;
    }

    await db
      .update(reproductionCycles)
      .set(updateData)
      .where(eq(reproductionCycles.id, cycleId));

    return await this.getCycleById(cycleId);
  },

  // ─── US‑6.4 : Enregistrement d'une mise bas ──────────────────────

  async recordLambing(cycleId: number, data: LambingInput, userId: number) {
    const cycle = await this.getCycleById(cycleId);
    if (!cycle) throw new Error('Cycle non trouvé');
    if (!cycle.pregnancyConfirmed) {
      throw new Error('Impossible d\'enregistrer une mise bas : la gestation n\'est pas confirmée');
    }

    const [mother] = await db
      .select({ breed: animals.breed, exploitationId: animals.exploitationId })
      .from(animals)
      .where(eq(animals.id, cycle.animalId));
    const motherBreed = mother?.breed || 'Sardi';
    const exploitationId = mother?.exploitationId || null;

    const updateData: any = {
      lambingDate: new Date(data.lambingDate),
      lambingType: data.lambingType,
      liveBorn: data.liveBorn,
      stillBorn: data.stillBorn,
    };
    await db
      .update(reproductionCycles)
      .set(updateData)
      .where(eq(reproductionCycles.id, cycleId));

    const lambs = data.lambs || [];
    const motherId = cycle.animalId;
    const fatherId = cycle.maleId;

    const createdLambs = [];
    for (const lambData of lambs) {
      const rfid = await this.generateRfid();
      const birthDate = lambData.birthDate || data.lambingDate;

      const [newAnimal] = await db
        .insert(animals)
        .values({
          rfid,
          name: lambData.name || `Agneau ${rfid}`,
          breed: motherBreed,
          sex: lambData.sex,
          birthDate: new Date(birthDate),
          weight: lambData.weight ? String(lambData.weight) : null,
          fatherId: fatherId,
          motherId: motherId,
          // ✅ L'exploitation est héritée de la mère (peut être null)
          exploitationId: exploitationId,
          healthStatus: 'HEALTHY',
        })
        .$returningId();
      createdLambs.push({ id: newAnimal.id, rfid });
    }

    const updatedCycle = await this.getCycleById(cycleId);
    return { ...updatedCycle, createdLambs };
  },

  // ─── Fonctions auxiliaires ────────────────────────────────────────

  async getExploitationIdForAnimal(animalId: number): Promise<number | null> {
    const [animal] = await db
      .select({ exploitationId: animals.exploitationId })
      .from(animals)
      .where(eq(animals.id, animalId));
    return animal?.exploitationId || null;
  },

  async generateRfid(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MA${year}`;
    const count = await db.$count(animals);
    const nextId = count + 1;
    const padded = nextId.toString().padStart(6, '0');
    return `${prefix}${padded}`;
  },

  // ─── US‑6.5 : Performance reproductive ──────────────────────────

  async getReproductivePerformance(animalId: number) {
    const cycles = await this.getCyclesByAnimalId(animalId);
    if (cycles.length === 0) {
      return {
        animalId,
        totalCycles: 0,
        confirmedCycles: 0,
        fertilityRate: 0,
        prolificity: 0,
        lambingInterval: 0,
        matingSuccessRate: 0,
        servicesPerPregnancy: 0,
      };
    }

    const confirmedCycles = cycles.filter(c => c.pregnancyConfirmed);
    const fertilityRate = (confirmedCycles.length / cycles.length) * 100;

    const lambings = confirmedCycles.filter(c => c.lambingDate !== null);
    const totalLambs = lambings.reduce((sum, c) => {
      return sum + (c.liveBorn || 0) + (c.stillBorn || 0);
    }, 0);
    const prolificity = lambings.length > 0 ? totalLambs / lambings.length : 0;

    let lambingInterval = 0;
    if (lambings.length >= 2) {
      const sorted = [...lambings].sort((a, b) =>
        new Date(a.lambingDate!).getTime() - new Date(b.lambingDate!).getTime()
      );
      let totalDays = 0;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i-1].lambingDate!);
        const curr = new Date(sorted[i].lambingDate!);
        totalDays += (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      }
      lambingInterval = totalDays / (sorted.length - 1);
    }

    const matingServices = await matingService.getServicesByAnimalId(animalId);
    const totalMating = matingServices.length;
    const successfulMating = matingServices.filter(m => m.result === 'success').length;
    const matingSuccessRate = totalMating > 0 ? (successfulMating / totalMating) * 100 : 0;

    let totalServicesForPregnancies = 0;
    let pregnanciesWithServices = 0;
    for (const cycle of confirmedCycles) {
      const services = await matingService.getServicesByCycleId(cycle.id);
      if (services.length > 0) {
        totalServicesForPregnancies += services.length;
        pregnanciesWithServices++;
      }
    }
    const servicesPerPregnancy = pregnanciesWithServices > 0
      ? totalServicesForPregnancies / pregnanciesWithServices
      : 0;

    return {
      animalId,
      totalCycles: cycles.length,
      confirmedCycles: confirmedCycles.length,
      fertilityRate: Math.round(fertilityRate * 10) / 10,
      prolificity: Math.round(prolificity * 10) / 10,
      lambingInterval: Math.round(lambingInterval * 10) / 10,
      matingSuccessRate: Math.round(matingSuccessRate * 10) / 10,
      servicesPerPregnancy: Math.round(servicesPerPregnancy * 10) / 10,
    };
  },

  async getHerdPerformance(exploitationId: number) {
    const females = await db
      .select()
      .from(animals)
      .where(
        and(
          eq(animals.exploitationId, exploitationId),
          eq(animals.sex, 'FEMALE')
        )
      );

    const performances = [];
    for (const female of females) {
      const perf = await this.getReproductivePerformance(female.id);
      performances.push({ animal: female, performance: perf });
    }

    const totalCycles = performances.reduce((sum, p) => sum + p.performance.totalCycles, 0);
    const totalConfirmed = performances.reduce((sum, p) => sum + p.performance.confirmedCycles, 0);
    const avgFertility = performances.length > 0
      ? performances.reduce((sum, p) => sum + p.performance.fertilityRate, 0) / performances.length
      : 0;
    const avgProlificity = performances.length > 0
      ? performances.reduce((sum, p) => sum + p.performance.prolificity, 0) / performances.length
      : 0;
    const avgLambingInterval = performances.length > 0
      ? performances.reduce((sum, p) => sum + p.performance.lambingInterval, 0) / performances.length
      : 0;

    return {
      females: performances,
      summary: {
        totalFemales: females.length,
        totalCycles,
        totalConfirmed,
        avgFertility: Math.round(avgFertility * 10) / 10,
        avgProlificity: Math.round(avgProlificity * 10) / 10,
        avgLambingInterval: Math.round(avgLambingInterval * 10) / 10,
      }
    };
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