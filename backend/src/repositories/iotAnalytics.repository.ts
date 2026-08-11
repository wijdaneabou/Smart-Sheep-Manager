import { db } from "../db/connection.js";
import { iotSensorData } from "../db/schema/iotSensorData.js";
import { iotShields } from "../db/schema/iotShields.js";
import { animals } from "../db/schema/animals.js";
import { eq, and, gte, asc, sql } from "drizzle-orm";

/**
 * Statistiques journalières (température moy/max, ratio de pâturage) pour un
 * bouclier, sur une période donnée. GROUP BY simple — pas de LATERAL, donc
 * compatible MariaDB.
 */
export async function getDailyStats(shieldId: number, since: Date) {
  return db
    .select({
      day: sql<string>`DATE(${iotSensorData.measuredAt})`,
      avgTemperature: sql<number>`AVG(${iotSensorData.temperature})`,
      maxTemperature: sql<number>`MAX(${iotSensorData.temperature})`,
      grazingCount: sql<number>`SUM(CASE WHEN ${iotSensorData.activity} = 'GRAZING' THEN 1 ELSE 0 END)`,
      totalCount: sql<number>`COUNT(*)`,
    })
    .from(iotSensorData)
    .where(
      and(eq(iotSensorData.shieldId, shieldId), gte(iotSensorData.measuredAt, since))
    )
    .groupBy(sql`DATE(${iotSensorData.measuredAt})`)
    .orderBy(sql`DATE(${iotSensorData.measuredAt}) ASC`);
}

/**
 * Lectures ordonnées chronologiquement avec position GPS, pour calculer la
 * distance parcourue (Haversine entre points consécutifs) côté service.
 */
export async function getOrderedReadingsWithPosition(shieldId: number, since: Date) {
  return db
    .select({
      measuredAt: iotSensorData.measuredAt,
      latitude: iotSensorData.latitude,
      longitude: iotSensorData.longitude,
      temperature: iotSensorData.temperature,
      activity: iotSensorData.activity,
    })
    .from(iotSensorData)
    .where(
      and(eq(iotSensorData.shieldId, shieldId), gte(iotSensorData.measuredAt, since))
    )
    .orderBy(asc(iotSensorData.measuredAt));
}

/**
 * Boucliers d'une exploitation associés à un animal — base pour la
 * comparaison inter-animaux.
 */
export async function getAnimalShieldsForExploitation(exploitationId: number) {
  return db
    .select({
      shieldId: iotShields.id,
      ssmIotNumber: iotShields.ssmIotNumber,
      animalId: animals.id,
      animalName: animals.name,
      animalRfid: animals.rfid,
    })
    .from(iotShields)
    .innerJoin(animals, eq(iotShields.animalId, animals.id))
    .where(eq(iotShields.exploitationId, exploitationId));
}