import {
  findBatimentById,
  createBatiment as createBatimentInDb,
  updateBatiment as updateBatimentInDb,
  deleteBatiment as deleteBatimentInDb,
  listBatiments as listBatimentsInDb,
} from "../repositories/batiments.repository.js";

function parseEquipements(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeBatiment<T extends { equipements: string | null }>(batiment: T) {
  const { equipements, ...rest } = batiment;
  return { ...rest, equipements: parseEquipements(equipements) };
}

type SerializedBatiment = ReturnType<typeof serializeBatiment>;

export type CreateBatimentResult =
  | { success: true; status: 201; batiment: SerializedBatiment }
  | { success: false; status: 400; message: string };

export async function createBatiment(input: {
  exploitationId: number;
  name: string;
  type: "BERGERIE" | "STABULATION" | "BOX" | "PARC" | "PARCELLE";
  capacite?: number;
  superficie?: number;
  equipements?: string[];
  etat: "BON" | "MOYEN" | "MAUVAIS";
  occupationActuelle: number;
}): Promise<CreateBatimentResult> {
  const batiment = await createBatimentInDb({
    exploitationId: input.exploitationId,
    name: input.name,
    type: input.type,
    capacite: input.capacite,
    superficie: input.superficie ? String(input.superficie) : undefined,
    equipements: input.equipements ? JSON.stringify(input.equipements) : undefined,
    etat: input.etat,
    occupationActuelle: input.occupationActuelle,
  });

  if (!batiment) {
    return { success: false, status: 400, message: "Erreur lors de la creation." };
  }

  return { success: true, status: 201, batiment: serializeBatiment(batiment) };
}

export type UpdateBatimentResult =
  | { success: true; status: 200; batiment: SerializedBatiment }
  | { success: false; status: 404; message: string };

export async function updateBatiment(
  id: number,
  input: {
    name?: string;
    type?: "BERGERIE" | "STABULATION" | "BOX" | "PARC" | "PARCELLE";
    capacite?: number;
    superficie?: number;
    equipements?: string[];
    etat?: "BON" | "MOYEN" | "MAUVAIS";
    occupationActuelle?: number;
  }
): Promise<UpdateBatimentResult> {
  const existing = await findBatimentById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Batiment/parcelle introuvable." };
  }

  const updated = await updateBatimentInDb(id, {
    name: input.name,
    type: input.type,
    capacite: input.capacite,
    superficie: input.superficie !== undefined ? String(input.superficie) : undefined,
    equipements:
      input.equipements !== undefined ? JSON.stringify(input.equipements) : undefined,
    etat: input.etat,
    occupationActuelle: input.occupationActuelle,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Batiment/parcelle introuvable." };
  }

  return { success: true, status: 200, batiment: serializeBatiment(updated) };
}

export type GetBatimentResult =
  | { success: true; status: 200; batiment: SerializedBatiment }
  | { success: false; status: 404; message: string };

export async function getBatimentById(id: number): Promise<GetBatimentResult> {
  const batiment = await findBatimentById(id);
  if (!batiment) {
    return { success: false, status: 404, message: "Batiment/parcelle introuvable." };
  }
  return { success: true, status: 200, batiment: serializeBatiment(batiment) };
}

export type DeleteBatimentResult =
  | { success: true; status: 200 }
  | { success: false; status: 404; message: string };

export async function deleteBatiment(id: number): Promise<DeleteBatimentResult> {
  const existing = await findBatimentById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Batiment/parcelle introuvable." };
  }
  await deleteBatimentInDb(id);
  return { success: true, status: 200 };
}

export async function listBatiments(params: {
  exploitationId: number;
  page: number;
  limit: number;
  type?: string;
}) {
  const { rows, total } = await listBatimentsInDb(params);
  return {
    success: true as const,
    status: 200 as const,
    batiments: rows.map(serializeBatiment),
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}