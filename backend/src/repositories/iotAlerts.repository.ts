import { db } from "../db/connection.js";
import { iotAlerts } from "../db/schema/iotAlerts.js";
import { iotShields } from "../db/schema/iotShields.js";
import { animals } from "../db/schema/animals.js";
import { exploitations } from "../db/schema/exploitations.js";
import { eq, and, desc, count, sql } from "drizzle-orm";

type CreateAlertData = typeof iotAlerts.$inferInsert;

/**
 * Créer une nouvelle alerte
 */
export async function createAlert(data: CreateAlertData) {
  const [result] = await db.insert(iotAlerts).values(data).$returningId();
  return findAlertById(result.id);
}

/**
 * Récupérer une alerte par son ID avec toutes les relations.
 * Jointures explicites (pas de db.query...with) — MariaDB ne supporte pas
 * le LEFT JOIN LATERAL que Drizzle génère pour les relations imbriquées.
 */
export async function findAlertById(id: number) {
  const rows = await db
    .select({
      id: iotAlerts.id,
      shieldId: iotAlerts.shieldId,
      animalId: iotAlerts.animalId,
      exploitationId: iotAlerts.exploitationId,
      type: iotAlerts.type,
      severity: iotAlerts.severity,
      message: iotAlerts.message,
      value: iotAlerts.value,
      threshold: iotAlerts.threshold,
      resolved: iotAlerts.resolved,
      resolvedAt: iotAlerts.resolvedAt,
      createdAt: iotAlerts.createdAt,
      updatedAt: iotAlerts.updatedAt,
      shield: {
        id: iotShields.id,
        ssmIotNumber: iotShields.ssmIotNumber,
        sensorType: iotShields.sensorType,
        battery: iotShields.battery,
        status: iotShields.status,
        animalId: iotShields.animalId,
        exploitationId: iotShields.exploitationId,
      },
      animal: {
        id: animals.id,
        rfid: animals.rfid,
        name: animals.name,
        breed: animals.breed,
        sex: animals.sex,
      },
      exploitation: {
        id: exploitations.id,
        name: exploitations.name,
        latitude: exploitations.latitude,
        longitude: exploitations.longitude,
      },
    })
    .from(iotAlerts)
    .leftJoin(iotShields, eq(iotAlerts.shieldId, iotShields.id))
    .leftJoin(animals, eq(iotAlerts.animalId, animals.id))
    .leftJoin(exploitations, eq(iotAlerts.exploitationId, exploitations.id))
    .where(eq(iotAlerts.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Lister les alertes d'une exploitation avec filtres
 */
export async function listAlertsByExploitation(
  exploitationId: number,
  options?: {
    resolved?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  }
) {
  const conditions = [eq(iotAlerts.exploitationId, exploitationId)];

  if (options?.resolved !== undefined) {
    conditions.push(eq(iotAlerts.resolved, options.resolved ? 1 : 0));
  }
  if (options?.type) {
    conditions.push(eq(iotAlerts.type, options.type as any));
  }

  const whereClause = and(...conditions);
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const rows = await db
    .select()
    .from(iotAlerts)
    .where(whereClause)
    .orderBy(desc(iotAlerts.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(iotAlerts)
    .where(whereClause);

  return { rows, total };
}

/**
 * Vérifier si une alerte non résolue existe déjà pour un bouclier et un type
 */
export async function hasUnresolvedAlert(
  shieldId: number,
  type: string
): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(iotAlerts)
    .where(
      and(
        eq(iotAlerts.shieldId, shieldId),
        eq(iotAlerts.type, type as any),
        eq(iotAlerts.resolved, 0)
      )
    );
  return Number(result[0]?.count ?? 0) > 0;
}

/**
 * Marquer une alerte comme résolue
 */
export async function resolveAlert(id: number) {
  await db
    .update(iotAlerts)
    .set({ resolved: 1, resolvedAt: new Date(), updatedAt: new Date() })
    .where(eq(iotAlerts.id, id));
  return findAlertById(id);
}

/**
 * Compter les alertes non résolues par type pour une exploitation
 */
export async function countUnresolvedAlertsByExploitation(
  exploitationId: number
) {
  const result = await db
    .select({
      type: iotAlerts.type,
      count: sql<number>`count(*)`,
    })
    .from(iotAlerts)
    .where(
      and(
        eq(iotAlerts.exploitationId, exploitationId),
        eq(iotAlerts.resolved, 0)
      )
    )
    .groupBy(iotAlerts.type);
  return result;
}

/**
 * Lister les alertes non résolues d'un bouclier
 */
export async function listUnresolvedAlertsByShield(shieldId: number) {
  return db
    .select()
    .from(iotAlerts)
    .where(and(eq(iotAlerts.shieldId, shieldId), eq(iotAlerts.resolved, 0)))
    .orderBy(desc(iotAlerts.createdAt));
}

/**
 * Lister les alertes non résolues d'un animal
 */
export async function listUnresolvedAlertsByAnimal(animalId: number) {
  return db
    .select()
    .from(iotAlerts)
    .where(and(eq(iotAlerts.animalId, animalId), eq(iotAlerts.resolved, 0)))
    .orderBy(desc(iotAlerts.createdAt));
}
