import { db } from "../db/connection.js";
import { iotShieldStatus } from "../db/schema/iotShieldStatus.js";
import { iotShields } from "../db/schema/iotShields.js";
import { eq, and, inArray } from "drizzle-orm"; // added inArray

type UpsertShieldStatusData = {
  shieldId: number;
  temperature?: string;
  activity?: "REST" | "MOVEMENT" | "GRAZING" | null;
  latitude?: string;
  longitude?: string;
  measuredAt: Date;
};

/**
 * Met à jour la ligne d'état courant du bouclier si elle existe,
 * sinon la crée. Une seule ligne par shieldId, pour toujours.
 */
export async function upsertShieldStatus(data: UpsertShieldStatusData) {
  await db
    .insert(iotShieldStatus)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        temperature: data.temperature,
        activity: data.activity,
        latitude: data.latitude,
        longitude: data.longitude,
        measuredAt: data.measuredAt,
      },
    });
}

/**
 * Récupère l'état courant de tous les boucliers d'une ou plusieurs exploitations.
 * Si exploitationIds est null ou vide, aucune restriction (admin).
 */
export async function findLatestByExploitation(exploitationIds: number[] | null) {
  const conditions = [];
  if (exploitationIds && exploitationIds.length > 0) {
    conditions.push(inArray(iotShields.exploitationId, exploitationIds));
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;

  return db
    .select({
      shieldId: iotShieldStatus.shieldId,
      temperature: iotShieldStatus.temperature,
      activity: iotShieldStatus.activity,
      latitude: iotShieldStatus.latitude,
      longitude: iotShieldStatus.longitude,
      measuredAt: iotShieldStatus.measuredAt,
      shield: {
        id: iotShields.id,
        ssmIotNumber: iotShields.ssmIotNumber,
        battery: iotShields.battery,
        status: iotShields.status,
        animalId: iotShields.animalId,
      },
    })
    .from(iotShieldStatus)
    .innerJoin(iotShields, eq(iotShieldStatus.shieldId, iotShields.id))
    .where(whereClause);
}