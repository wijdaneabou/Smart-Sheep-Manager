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
import { eq, desc, inArray, sql } from 'drizzle-orm';

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

  async getHealthRecords(animalId: number) {
    return await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.animalId, animalId))
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
    // Insérer le nouveau dossier
    const [recordId] = await db
      .insert(healthRecords)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    // Récupérer l'enregistrement complet
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

  async getVaccinationsByAnimal(animalId: number) {
    return await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.animalId, animalId))
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
    // ✅ Récupérer l'animal sans filtre deleted_at
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

  async getHealthReport() {
    // ✅ Plus de filtre deleted_at
    const totalAnimalsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(animals);
    const totalAnimals = totalAnimalsResult[0]?.count || 0;

    const deceasedResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(animals)
      .where(eq(animals.healthStatus, 'DECEASED'));
    const deceased = deceasedResult[0]?.count || 0;

    const sickResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(animals)
      .where(eq(animals.healthStatus, 'SICK'));
    const sick = sickResult[0]?.count || 0;

    const totalRecordsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(healthRecords);
    const totalHealthRecords = totalRecordsResult[0]?.count || 0;

    const statusDistribution = await db
      .select({
        status: healthRecords.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(healthRecords)
      .groupBy(healthRecords.status);

    const distribution: Record<string, number> = {};
    statusDistribution.forEach((row) => {
      distribution[row.status] = Number(row.count);
    });

    const avgRecoveryResult = await db
      .select({
        avgDays: sql<number>`AVG(DATEDIFF(${healthRecords.updatedAt}, ${healthRecords.createdAt}))`,
      })
      .from(healthRecords)
      .where(eq(healthRecords.status, 'RECOVERED'));
    const avgRecoveryDays = Math.round(avgRecoveryResult[0]?.avgDays || 0);

    const recentHealthRecords = await db
      .select({
        type: sql<string>`'health_record'`,
        date: healthRecords.createdAt,
        description: sql<string>`CONCAT('Diagnostic: ', ${healthRecords.diagnosis}, ' pour animal #', ${healthRecords.animalId})`,
      })
      .from(healthRecords)
      .orderBy(desc(healthRecords.createdAt))
      .limit(5);

    const recentTreatments = await db
      .select({
        type: sql<string>`'treatment'`,
        date: treatments.createdAt,
        description: sql<string>`CONCAT('Traitement: ', ${treatments.medicationName}, ' pour dossier #', ${treatments.healthRecordId})`,
      })
      .from(treatments)
      .orderBy(desc(treatments.createdAt))
      .limit(5);

    const recentVaccinations = await db
      .select({
        type: sql<string>`'vaccination'`,
        date: vaccinations.date,
        description: sql<string>`CONCAT('Vaccination: ', ${vaccinations.vaccineType}, ' pour animal #', ${vaccinations.animalId})`,
      })
      .from(vaccinations)
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

    const morbidityRate = totalAnimals > 0 ? (sick / totalAnimals) * 100 : 0;
    const mortalityRate = totalAnimals > 0 ? (deceased / totalAnimals) * 100 : 0;

    const treatmentsCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(treatments);
    const treatmentsCount = treatmentsCountResult[0]?.count || 0;
    const avgCostPerAnimal = totalAnimals > 0 ? (treatmentsCount / totalAnimals) * 10 : 0;

    return {
      summary: {
        totalAnimals,
        totalHealthRecords,
        morbidityRate: Math.round(morbidityRate * 10) / 10,
        mortalityRate: Math.round(mortalityRate * 10) / 10,
        avgCostPerAnimal: Math.round(avgCostPerAnimal * 100) / 100,
        avgRecoveryDays,
      },
      statusDistribution: distribution,
      recentActivities,
    };
  }

  // ============================================
  // US-5.7: Interventions vétérinaires
  // ============================================

  async getInterventionsByAnimal(animalId: number) {
    return await db
      .select()
      .from(veterinaryInterventions)
      .where(eq(veterinaryInterventions.animalId, animalId))
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