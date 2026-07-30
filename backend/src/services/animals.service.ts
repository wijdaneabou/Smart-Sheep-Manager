import {
  findAnimalById,
  findAnimalByRfid,
  createAnimal as createAnimalInDb,
  updateAnimal as updateAnimalInDb,
  deleteAnimal as deleteAnimalInDb,
  listAnimals as listAnimalsInDb,

  getPedigreeTree,
  type PedigreeNode,
  type PedigreeAnimal,

} from "../repositories/animals.repository.js";

export type CreateAnimalResult =
  | {
      success: true;
      status: 201;
      animal: NonNullable<Awaited<ReturnType<typeof findAnimalById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createAnimal(input: {
  rfid: string;
  name: string;
  breed: "Sardi" | "Timahdite" | "D'man" | "Beni-Guil";
  sex: "MALE" | "FEMALE";
  birthDate?: string;
  fatherId?: number;
  motherId?: number;
  weight?: number;
  bcs?: number;
  healthStatus?: "HEALTHY" | "SICK" | "RECOVERING" | "DECEASED" | "QUARANTINE";
  exploitationId?: number;

  photoUrl?: string;

}): Promise<CreateAnimalResult> {
  // Vérifier l'unicité du RFID
  const existing = await findAnimalByRfid(input.rfid);
  if (existing) {
    return {
      success: false,
      status: 400,
      message: "Un animal avec ce RFID existe déjà.",
    };
  }

  const animal = await createAnimalInDb({
    rfid: input.rfid,
    name: input.name,
    breed: input.breed,
    sex: input.sex,
    birthDate: input.birthDate as any,
    fatherId: input.fatherId,
    motherId: input.motherId,
    weight: input.weight !== undefined ? String(input.weight) : undefined,
    bcs: input.bcs !== undefined ? String(input.bcs) : undefined,
    healthStatus: input.healthStatus ?? "HEALTHY",
    exploitationId: input.exploitationId,

    photoUrl: input.photoUrl,

  });

  if (!animal) {
    return { success: false, status: 400, message: "Erreur lors de la création." };
  }

  return { success: true, status: 201, animal };
}

export type UpdateAnimalResult =
  | {
      success: true;
      status: 200;
      animal: NonNullable<Awaited<ReturnType<typeof findAnimalById>>>;
    }
  | { success: false; status: 400; message: string }
  | { success: false; status: 404; message: string };

export async function updateAnimal(
  id: number,
  input: {
    rfid?: string;
    name?: string;
    breed?: "Sardi" | "Timahdite" | "D'man" | "Beni-Guil";
    sex?: "MALE" | "FEMALE";
    birthDate?: string | null;
    fatherId?: number | null;
    motherId?: number | null;
    weight?: number | null;
    bcs?: number | null;
    healthStatus?: "HEALTHY" | "SICK" | "RECOVERING" | "DECEASED" | "QUARANTINE";
    exploitationId?: number | null;

    photoUrl?: string;

  }
): Promise<UpdateAnimalResult> {
  const existing = await findAnimalById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Animal introuvable." };
  }

  // Vérifier l'unicité du RFID si modifié
  if (input.rfid && input.rfid !== existing.rfid) {
    const rfidOwner = await findAnimalByRfid(input.rfid);
    if (rfidOwner) {
      return {
        success: false,
        status: 400,
        message: "Un animal avec ce RFID existe déjà.",
      };
    }
  }

  const updated = await updateAnimalInDb(id, {
    rfid: input.rfid,
    name: input.name,
    breed: input.breed,
    sex: input.sex,
    birthDate: input.birthDate as any,
    fatherId: input.fatherId ?? undefined,
    motherId: input.motherId ?? undefined,
    weight:
      input.weight !== undefined ? (input.weight === null ? undefined : String(input.weight)) : undefined,
    bcs:
      input.bcs !== undefined ? (input.bcs === null ? undefined : String(input.bcs)) : undefined,
    healthStatus: input.healthStatus,
    exploitationId: input.exploitationId ?? undefined,

    photoUrl: input.photoUrl,

  });

  if (!updated) {
    return { success: false, status: 404, message: "Animal introuvable." };
  }

  return { success: true, status: 200, animal: updated };
}

export type GetAnimalResult =
  | {
      success: true;
      status: 200;
      animal: NonNullable<Awaited<ReturnType<typeof findAnimalById>>>;
    }
  | { success: false; status: 404; message: string };

export async function getAnimalById(id: number): Promise<GetAnimalResult> {
  const animal = await findAnimalById(id);
  if (!animal) {
    return { success: false, status: 404, message: "Animal introuvable." };
  }
  return { success: true, status: 200, animal };
}

export async function listAnimals(params: {
  page: number;
  limit: number;
  search?: string;
  breed?: string;
  sex?: string;
  healthStatus?: string;
}) {
  const { rows, total } = await listAnimalsInDb(params);
  return {
    success: true as const,
    status: 200 as const,
    animals: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function deleteAnimal(id: number): Promise<UpdateAnimalResult> {
  const existing = await findAnimalById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Animal introuvable." };
  }
  await deleteAnimalInDb(id);
  return { success: true, status: 200, animal: existing };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pedigree / Genealogical Tree
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Information about a consanguinity (inbreeding) alert.
 * When the same ancestor appears on both the paternal and maternal sides,
 * the coefficient of relationship can be computed.
 */
export interface ConsanguinityAlert {
  animalId: number;
  animalName: string;
  occurrences: number;
  paths: string[];
}

/**
 * Result of the pedigree query, including the tree and any consanguinity alerts.
 */
export interface PedigreeResult {
  tree: PedigreeNode;
  consanguinityAlerts: ConsanguinityAlert[];
  hasConsanguinity: boolean;
}

/**
 * Traverses the pedigree tree and collects all animal IDs with their
 * relationship paths. Used to detect consanguinity (same ancestor appearing
 * on both paternal and maternal sides).
 */
function collectAncestors(
  node: PedigreeNode | null,
  path: string,
  map: Map<number, string[]>
) {
  if (!node || !node.animal) return;

  const currentPath = path ? `${path} → ${node.animal.name}` : node.animal.name;

  // Record this animal
  if (!map.has(node.animal.id)) {
    map.set(node.animal.id, []);
  }
  map.get(node.animal.id)!.push(currentPath);

  // Recurse into parents
  collectAncestors(node.father, `${currentPath} (père)`, map);
  collectAncestors(node.mother, `${currentPath} (mère)`, map);
}

/**
 * Builds the pedigree tree for an animal and detects consanguinity.
 *
 * @param animalId       The subject animal.
 * @param maxGenerations Number of generations (default 3).
 * @returns              The tree, consanguinity alerts, and a boolean flag.
 */
export async function getPedigree(
  animalId: number,
  maxGenerations: number = 3
): Promise<
  | { success: true; status: 200; data: PedigreeResult }
  | { success: false; status: 404; message: string }
> {
  const tree = await getPedigreeTree(animalId, maxGenerations);
  if (!tree) {
    return { success: false, status: 404, message: "Animal introuvable." };
  }

  // Detect consanguinity: collect all ancestors and find duplicates
  const ancestorMap = new Map<number, string[]>();
  collectAncestors(tree.father, "Père", ancestorMap);
  collectAncestors(tree.mother, "Mère", ancestorMap);

  const consanguinityAlerts: ConsanguinityAlert[] = [];
  for (const [id, paths] of ancestorMap) {
    if (paths.length > 1) {
      // Find the animal name from the first path
      const nameMatch = paths[0].match(/→ ([^(]+)/);
      const name = nameMatch ? nameMatch[1].trim() : `Animal #${id}`;
      consanguinityAlerts.push({
        animalId: id,
        animalName: name,
        occurrences: paths.length,
        paths,
      });
    }
  }

  return {
    success: true,
    status: 200,
    data: {
      tree,
      consanguinityAlerts,
      hasConsanguinity: consanguinityAlerts.length > 0,
    },
  };
}

