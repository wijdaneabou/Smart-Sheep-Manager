import {
  createZone as createZoneInDb,
  findZoneById,
  listZonesByExploitation as listZonesByExploitationInDb,
  updateZone as updateZoneInDb,
  deleteZone as deleteZoneInDb,
} from "../repositories/iotZones.repository.js";
import type { ZonePoint } from "../db/schema/iotZones.js";

// ── Sérialisation ─────────────────────────────────────────────────

export interface SerializedZone {
  id: number;
  exploitationId: number;
  name: string;
  color: string | null;
  polygon: ZonePoint[];
  createdAt: Date;
  updatedAt: Date;
}

function serializeZone(row: any): SerializedZone {
  return {
    id: row.id,
    exploitationId: row.exploitationId,
    name: row.name,
    color: row.color,
    polygon: JSON.parse(row.polygon) as ZonePoint[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function validatePolygon(polygon: ZonePoint[]): string | null {
  if (!Array.isArray(polygon) || polygon.length < 3) {
    return "Une zone doit contenir au moins 3 points.";
  }
  for (const p of polygon) {
    if (
      typeof p.lat !== "number" ||
      typeof p.lng !== "number" ||
      p.lat < -90 ||
      p.lat > 90 ||
      p.lng < -180 ||
      p.lng > 180
    ) {
      return "Coordonnées de zone invalides.";
    }
  }
  return null;
}

// ── Test point-dans-polygone (ray casting) ─────────────────────────

function isPointInPolygon(point: ZonePoint, polygon: ZonePoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Vérifie si un point (lat/lng) se trouve dans au moins une des zones de
 * l'exploitation. Si l'exploitation n'a défini AUCUNE zone, on considère
 * qu'il n'y a pas de restriction (retourne true) — pas de fausse alerte
 * tant que l'éleveur n'a pas configuré de zone.
 */
export async function isPointInsideAnyZone(
  exploitationId: number,
  lat: number,
  lng: number
): Promise<{ insideZone: boolean; hasZonesDefined: boolean }> {
  const zones = await listZonesByExploitationInDb(exploitationId);
  if (zones.length === 0) {
    return { insideZone: true, hasZonesDefined: false };
  }

  const point = { lat, lng };
  const insideZone = zones.some((zone) =>
    isPointInPolygon(point, JSON.parse(zone.polygon) as ZonePoint[])
  );

  return { insideZone, hasZonesDefined: true };
}

// ── API publique (CRUD) ─────────────────────────────────────────────

export type CreateZoneResult =
  | { success: true; status: 201; zone: SerializedZone }
  | { success: false; status: 400; message: string };

export async function createZone(input: {
  exploitationId: number;
  name: string;
  color?: string;
  polygon: ZonePoint[];
}): Promise<CreateZoneResult> {
  const validationError = validatePolygon(input.polygon);
  if (validationError) {
    return { success: false, status: 400, message: validationError };
  }

  const zone = await createZoneInDb({
    exploitationId: input.exploitationId,
    name: input.name,
    color: input.color ?? "#0F7A3C",
    polygon: JSON.stringify(input.polygon),
  });

  if (!zone) {
    return { success: false, status: 400, message: "Erreur lors de la création de la zone." };
  }
  return { success: true, status: 201, zone: serializeZone(zone) };
}

export type ListZonesResult = { success: true; status: 200; zones: SerializedZone[] };

export async function listZones(exploitationId: number): Promise<ListZonesResult> {
  const rows = await listZonesByExploitationInDb(exploitationId);
  return { success: true, status: 200, zones: rows.map(serializeZone) };
}

export type UpdateZoneResult =
  | { success: true; status: 200; zone: SerializedZone }
  | { success: false; status: 400; message: string }
  | { success: false; status: 404; message: string };

export async function updateZone(
  id: number,
  input: { name?: string; color?: string; polygon?: ZonePoint[] }
): Promise<UpdateZoneResult> {
  const existing = await findZoneById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Zone introuvable." };
  }

  if (input.polygon) {
    const validationError = validatePolygon(input.polygon);
    if (validationError) {
      return { success: false, status: 400, message: validationError };
    }
  }

  const updated = await updateZoneInDb(id, {
    name: input.name,
    color: input.color,
    polygon: input.polygon ? JSON.stringify(input.polygon) : undefined,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Zone introuvable." };
  }
  return { success: true, status: 200, zone: serializeZone(updated) };
}

export type DeleteZoneResult =
  | { success: true; status: 200 }
  | { success: false; status: 404; message: string };

export async function deleteZone(id: number): Promise<DeleteZoneResult> {
  const existing = await findZoneById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Zone introuvable." };
  }
  await deleteZoneInDb(id);
  return { success: true, status: 200 };
}