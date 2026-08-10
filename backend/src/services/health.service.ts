import { db } from '../db/connection.js';
import {
  animals,
  healthRecords,
  treatments,
  vaccinations,
  veterinaryInterventions,
  NewHealthRecord,
  NewTreatment,
} from '../db/schema/index.js';
import { eq, desc, inArray, sql, and } from 'drizzle-orm'; // 👈 AJOUT: and

export type CarnetEvent = {
  type: 'health_record' | 'treatment' | 'vaccination';
  date: Date;
  data: Record<string, any>;
};

export type AnimalCarnet = {
  animal: {
    id: number;
    name: string;
    rfid: string;
    breed: string;
    sex: string;
    birthDate: Date | null;
  };
  events: CarnetEvent[];
};

export class HealthService {
  // ============================================
  // US-5.1: Dossiers médicaux
  // ============================================

  async getHealthRecords(animalId: number, exploitationIds?: number[]) {
    // ✅ Construire les conditions
    const conditions = [eq(healthRecords.animalId, animalId)];

    if (exploitationIds && exploitationIds.length > 0) {
      conditions.push(inArray(animals.exploitationId, exploitationIds));
    } else if (exploitationIds && exploitationIds.length === 0) {
      return [];
    }

    return await db
      .select({
        id: healthRecords.id,
        animalId: healthRecords.animalId,
        status: healthRecords.status,
        symptoms: healthRecords.symptoms,
        diagnosis: healthRecords.diagnosis,
        severity: healthRecords.severity,
        recordedBy: healthRecords.recordedBy,
        createdAt: healthRecords.createdAt,
        updatedAt: healthRecords.updatedAt,
        animalName: animals.name,
        animalRfid: animals.rfid,
        animalPhotoUrl: animals.photoUrl,
        animalExploitationId: animals.exploitationId,
      })
      .from(healthRecords)
      .leftJoin(animals, eq(healthRecords.animalId, animals.id))
      .where(and(...conditions))
      .orderBy(desc(healthRecords.createdAt));
  }

  async getAllHealthRecordsWithAnimals(exploitationIds?: number[]) {
    // ✅ Construire les conditions
    const conditions: any[] = [];

    if (exploitationIds && exploitationIds.length > 0) {
      conditions.push(inArray(animals.exploitationId, exploitationIds));
    } else if (exploitationIds && exploitationIds.length === 0) {
      return [];
    }

    const query = db
      .select({
        id: healthRecords.id,
        animalId: healthRecords.animalId,
        status: healthRecords.status,
        symptoms: healthRecords.symptoms,
        diagnosis: healthRecords.diagnosis,
        severity: healthRecords.severity,
        recordedBy: healthRecords.recordedBy,
        createdAt: healthRecords.createdAt,
        updatedAt: healthRecords.updatedAt,
        animalName: animals.name,
        animalRfid: animals.rfid,
        animalPhotoUrl: animals.photoUrl,
        animalExploitationId: animals.exploitationId,
      })
      .from(healthRecords)
      .leftJoin(animals, eq(healthRecords.animalId, animals.id));

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(healthRecords.createdAt));
    }

    return await query.orderBy(desc(healthRecords.createdAt));
  }

  // Récupère TOUS les dossiers (sans jointure) – gardé pour compatibilité
  async getAllHealthRecords() {
    return await db
      .select()
      .from(healthRecords)
      .orderBy(desc(healthRecords.createdAt));
  }

  async getLatestHealthRecord(animalId: number) {
    const [record] = await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.animalId, animalId))
      .orderBy(desc(healthRecords.createdAt))
      .limit(1);
    return record;
  }

  async getHealthRecordById(id: number) {
    const [record] = await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.id, id));
    return record;
  }

  async createHealthRecord(data: NewHealthRecord) {
    const [recordId] = await db
      .insert(healthRecords)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    const [created] = await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.id, recordId.id));
    return created;
  }

  async updateHealthRecord(id: number, data: Partial<NewHealthRecord>) {
    await db
      .update(healthRecords)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(healthRecords.id, id));

    const [record] = await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.id, id));
    return record;
  }

  async deleteHealthRecord(id: number) {
    const [record] = await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.id, id));
    if (!record) {
      throw new Error('Dossier médical non trouvé');
    }
    await db.delete(healthRecords).where(eq(healthRecords.id, id));
  }

  // ============================================
  // US-5.2: Traitements
  // ============================================

  async getTreatmentsByHealthRecord(healthRecordId: number) {
    return await db
      .select()
      .from(treatments)
      .where(eq(treatments.healthRecordId, healthRecordId))
      .orderBy(desc(treatments.createdAt));
  }

  async getTreatmentById(id: number) {
    const [treatment] = await db
      .select()
      .from(treatments)
      .where(eq(treatments.id, id));
    return treatment;
  }

  async createTreatment(data: NewTreatment) {
    const [treatmentId] = await db
      .insert(treatments)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    const [created] = await db
      .select()
      .from(treatments)
      .where(eq(treatments.id, treatmentId.id));
    return created;
  }

  async updateTreatment(id: number, data: Partial<NewTreatment>) {
    await db
      .update(treatments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(treatments.id, id));

    const [treatment] = await db
      .select()
      .from(treatments)
      .where(eq(treatments.id, id));
    return treatment;
  }

  async administerTreatment(id: number, userId: number) {
    await db
      .update(treatments)
      .set({
        administered: true,
        administeredAt: new Date(),
        administeredBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(treatments.id, id));

    const [treatment] = await db
      .select()
      .from(treatments)
      .where(eq(treatments.id, id));
    return treatment;
  }

  async deleteTreatment(id: number) {
    const [treatment] = await db
      .select()
      .from(treatments)
      .where(eq(treatments.id, id));
    if (!treatment) {
      throw new Error('Traitement non trouvé');
    }
    await db.delete(treatments).where(eq(treatments.id, id));
  }

  // ============================================
  // US-5.3: Vaccinations
  // ============================================

  async getVaccinationsByAnimal(animalId: number, exploitationIds?: number[]) {
    // ✅ Construire les conditions
    const conditions = [eq(vaccinations.animalId, animalId)];

    if (exploitationIds && exploitationIds.length > 0) {
      conditions.push(inArray(animals.exploitationId, exploitationIds));
    } else if (exploitationIds && exploitationIds.length === 0) {
      return [];
    }

    return await db
      .select()
      .from(vaccinations)
      .leftJoin(animals, eq(vaccinations.animalId, animals.id))
      .where(and(...conditions))
      .orderBy(desc(vaccinations.date));
  }

  async getVaccinationById(id: number) {
    const [vaccination] = await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.id, id));
    return vaccination;
  }

  async createVaccination(data: any) {
    const [vaccinationId] = await db
      .insert(vaccinations)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    const [created] = await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.id, vaccinationId.id));
    return created;
  }

  async updateVaccination(id: number, data: Partial<any>) {
    await db
      .update(vaccinations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(vaccinations.id, id));

    const [vaccination] = await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.id, id));
    return vaccination;
  }

  async updateVaccinationStatus(id: number, status: 'PENDING' | 'DONE' | 'OVERDUE', userId: number) {
    await db
      .update(vaccinations)
      .set({
        status,
        administeredBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(vaccinations.id, id));

    const [vaccination] = await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.id, id));
    return vaccination;
  }

  async deleteVaccination(id: number) {
    const [vaccination] = await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.id, id));
    if (!vaccination) {
      throw new Error('Vaccination non trouvée');
    }
    await db.delete(vaccinations).where(eq(vaccinations.id, id));
  }

  // ============================================
  // US-5.4: Carnet sanitaire
  // ============================================

  async getAnimalCarnet(animalId: number): Promise<AnimalCarnet> {
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (!animal) {
      throw new Error('Animal non trouvé');
    }

    const healthRecordsList = await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.animalId, animalId))
      .orderBy(desc(healthRecords.createdAt));

    const healthRecordIds = healthRecordsList.map((record) => record.id);

    const treatmentsList = healthRecordIds.length > 0
      ? await db
          .select()
          .from(treatments)
          .where(inArray(treatments.healthRecordId, healthRecordIds))
          .orderBy(desc(treatments.createdAt))
      : [];

    const vaccinationsList = await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.animalId, animalId))
      .orderBy(desc(vaccinations.date));

    const events: CarnetEvent[] = [
      ...healthRecordsList.map((record) => ({
        type: 'health_record' as const,
        date: record.createdAt ?? new Date(0),
        data: {
          id: record.id,
          status: record.status,
          symptoms: record.symptoms,
          diagnosis: record.diagnosis,
          severity: record.severity,
        },
      })),
      ...treatmentsList.map((treatment) => ({
        type: 'treatment' as const,
        date: treatment.createdAt ?? new Date(0),
        data: {
          id: treatment.id,
          medicationName: treatment.medicationName,
          dosage: treatment.dosage,
          administered: treatment.administered,
        },
      })),
      ...vaccinationsList.map((vaccination) => ({
        type: 'vaccination' as const,
        date: vaccination.date ?? new Date(0),
        data: {
          id: vaccination.id,
          vaccineType: vaccination.vaccineType,
          status: vaccination.status,
        },
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      animal: {
        id: animal.id,
        name: animal.name,
        rfid: animal.rfid,
        breed: animal.breed,
        sex: animal.sex,
        birthDate: animal.birthDate,
      },
      events,
    };
  }

  // ============================================
  // US-5.6: Rapport sanitaire
  // ============================================

  async getHealthReport(exploitationIds?: number[]) {
    // ✅ Filtrer les animaux par exploitation(s) autorisée(s)
    let animalIds: number[] = [];

    if (exploitationIds && exploitationIds.length > 0) {
      const filteredAnimals = await db
        .select({ id: animals.id })
        .from(animals)
        .where(inArray(animals.exploitationId, exploitationIds));
      animalIds = filteredAnimals.map(a => a.id);
    } else if (exploitationIds && exploitationIds.length === 0) {
      return {
        summary: {
          totalAnimals: 0,
          totalHealthRecords: 0,
          morbidityRate: 0,
          mortalityRate: 0,
          avgCostPerAnimal: 0,
          avgRecoveryDays: 0,
        },
        statusDistribution: {},
        recentActivities: [],
      };
    } else {
      // Aucun filtre → tous les animaux
      const allAnimals = await db.select({ id: animals.id }).from(animals);
      animalIds = allAnimals.map(a => a.id);
    }

    const totalAnimals = animalIds.length;

    if (totalAnimals === 0) {
      return {
        summary: {
          totalAnimals: 0,
          totalHealthRecords: 0,
          morbidityRate: 0,
          mortalityRate: 0,
          avgCostPerAnimal: 0,
          avgRecoveryDays: 0,
        },
        statusDistribution: {},
        recentActivities: [],
      };
    }

    // Compter les animaux malades et décédés
    const allAnimalsFull = await db
      .select()
      .from(animals)
      .where(inArray(animals.id, animalIds));

    const sickCount = allAnimalsFull.filter(a => a.healthStatus === 'SICK').length;
    const deceasedCount = allAnimalsFull.filter(a => a.healthStatus === 'DECEASED').length;

    // Récupérer les dossiers médicaux des animaux autorisés
    const healthRecordsList = await db
      .select()
      .from(healthRecords)
      .where(inArray(healthRecords.animalId, animalIds));

    const totalHealthRecords = healthRecordsList.length;

    // Distribution des statuts
    const distribution: Record<string, number> = {};
    healthRecordsList.forEach((record) => {
      distribution[record.status] = (distribution[record.status] || 0) + 1;
    });

    // Temps de guérison moyen
    const recoveredRecords = healthRecordsList.filter(r => r.status === 'RECOVERED');
    let avgRecoveryDays = 0;
    if (recoveredRecords.length > 0) {
      const totalDays = recoveredRecords.reduce((sum, r) => {
        const start = r.createdAt ? new Date(r.createdAt).getTime() : 0;
        const end = r.updatedAt ? new Date(r.updatedAt).getTime() : Date.now();
        const days = (end - start) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgRecoveryDays = Math.round(totalDays / recoveredRecords.length);
    }

    // Activités récentes (limitées aux animaux autorisés)
    const recentHealthRecords = await db
      .select({
        type: sql<string>`'health_record'`,
        date: healthRecords.createdAt,
        description: sql<string>`CONCAT('Diagnostic: ', ${healthRecords.diagnosis}, ' pour ', ${animals.name})`,
      })
      .from(healthRecords)
      .leftJoin(animals, eq(healthRecords.animalId, animals.id))
      .where(inArray(healthRecords.animalId, animalIds))
      .orderBy(desc(healthRecords.createdAt))
      .limit(5);

    const recentTreatments = await db
      .select({
        type: sql<string>`'treatment'`,
        date: treatments.createdAt,
        description: sql<string>`CONCAT('Traitement: ', ${treatments.medicationName}, ' pour ', ${animals.name})`,
      })
      .from(treatments)
      .leftJoin(healthRecords, eq(treatments.healthRecordId, healthRecords.id))
      .leftJoin(animals, eq(healthRecords.animalId, animals.id))
      .where(inArray(healthRecords.animalId, animalIds))
      .orderBy(desc(treatments.createdAt))
      .limit(5);

    const recentVaccinations = await db
      .select({
        type: sql<string>`'vaccination'`,
        date: vaccinations.date,
        description: sql<string>`CONCAT('Vaccination: ', ${vaccinations.vaccineType}, ' pour ', ${animals.name})`,
      })
      .from(vaccinations)
      .leftJoin(animals, eq(vaccinations.animalId, animals.id))
      .where(inArray(vaccinations.animalId, animalIds))
      .orderBy(desc(vaccinations.date))
      .limit(5);

    const allActivities = [
      ...recentHealthRecords,
      ...recentTreatments,
      ...recentVaccinations,
    ] as Array<{ type: string; date: Date; description: string }>;

    const recentActivities = allActivities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((activity) => ({
        type: activity.type,
        date: activity.date,
        description: activity.description,
      }));

    const morbidityRate = totalAnimals > 0 ? (sickCount / totalAnimals) * 100 : 0;
    const mortalityRate = totalAnimals > 0 ? (deceasedCount / totalAnimals) * 100 : 0;

    return {
      summary: {
        totalAnimals,
        totalHealthRecords,
        morbidityRate: Math.round(morbidityRate * 10) / 10,
        mortalityRate: Math.round(mortalityRate * 10) / 10,
        avgCostPerAnimal: 0,
        avgRecoveryDays,
      },
      statusDistribution: distribution,
      recentActivities,
    };
  }

  // ============================================
  // US-5.7: Interventions vétérinaires
  // ============================================

  async getInterventionsByAnimal(animalId: number, exploitationIds?: number[]) {
    const conditions = [eq(veterinaryInterventions.animalId, animalId)];

    if (exploitationIds && exploitationIds.length > 0) {
      conditions.push(inArray(animals.exploitationId, exploitationIds));
    } else if (exploitationIds && exploitationIds.length === 0) {
      return [];
    }

    return await db
      .select()
      .from(veterinaryInterventions)
      .leftJoin(animals, eq(veterinaryInterventions.animalId, animals.id))
      .where(and(...conditions))
      .orderBy(desc(veterinaryInterventions.date));
  }

  async getInterventionById(id: number) {
    const [intervention] = await db
      .select()
      .from(veterinaryInterventions)
      .where(eq(veterinaryInterventions.id, id));
    return intervention;
  }

  async createIntervention(data: any) {
    const [interventionId] = await db
      .insert(veterinaryInterventions)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    const [created] = await db
      .select()
      .from(veterinaryInterventions)
      .where(eq(veterinaryInterventions.id, interventionId.id));
    return created;
  }

  async updateIntervention(id: number, data: Partial<any>) {
    await db
      .update(veterinaryInterventions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(veterinaryInterventions.id, id));

    const [intervention] = await db
      .select()
      .from(veterinaryInterventions)
      .where(eq(veterinaryInterventions.id, id));
    return intervention;
  }

  async deleteIntervention(id: number) {
    const [intervention] = await db
      .select()
      .from(veterinaryInterventions)
      .where(eq(veterinaryInterventions.id, id));
    if (!intervention) {
      throw new Error('Intervention non trouvée');
    }
    await db.delete(veterinaryInterventions).where(eq(veterinaryInterventions.id, id));
  }
}