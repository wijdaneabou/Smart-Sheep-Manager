import { db } from "../db/connection.js";
import { animals } from "../db/schema/animals.js";
import { eq, and, like, desc, count, or } from "drizzle-orm";

type CreateAnimalData = typeof animals.$inferInsert;
type UpdateAnimalData = Partial<CreateAnimalData>;

export async function findAnimalById(id: number) {
  const result = await db.query.animals.findFirst({
    where: eq(animals.id, id),
  });
  return result ?? null;
}

export async function findAnimalByRfid(rfid: string) {
  const result = await db.query.animals.findFirst({
    where: eq(animals.rfid, rfid),
  });
  return result ?? null;
}

export async function createAnimal(data: CreateAnimalData) {
  const [result] = await db.insert(animals).values(data).$returningId();
  return findAnimalById(result.id);
}

export async function updateAnimal(id: number, data: UpdateAnimalData) {
  await db
    .update(animals)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(animals.id, id));
  return findAnimalById(id);
}

export async function deleteAnimal(id: number) {
  await db.delete(animals).where(eq(animals.id, id));
}

export async function listAnimals(params: {
  page: number;
  limit: number;
  search?: string;
  breed?: string;
  sex?: string;
  healthStatus?: string;
}) {
  const conditions = [];

  if (params.search) {
    conditions.push(
      or(
        like(animals.name, `%${params.search}%`),
        like(animals.rfid, `%${params.search}%`)
      )
    );
  }
  if (params.breed) {
    conditions.push(eq(animals.breed, params.breed as any));
  }
  if (params.sex) {
    conditions.push(eq(animals.sex, params.sex as any));
  }
  if (params.healthStatus) {
    conditions.push(eq(animals.healthStatus, params.healthStatus as any));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(animals)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(animals.createdAt));

  const [{ total }] = await db
    .select({ total: count() })
    .from(animals)
    .where(whereClause);

  return { rows, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pedigree / Genealogical Tree
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compact animal info returned as part of the pedigree tree.
 * Only the fields relevant for a genealogical view are included.
 */
export interface PedigreeAnimal {
  id: number;
  rfid: string;
  name: string;
  breed: string;
  sex: string;
  birthDate: string | null;
  weight: string | null;
  bcs: string | null;
  healthStatus: string;
  photoUrl: string | null;
}

/**
 * A node in the recursive pedigree tree.
 * `animal` is null when the parent is unknown (not recorded).
 * `father` / `mother` are null when the corresponding parent ID is missing
 * or when the maximum generation depth has been reached.
 */
export interface PedigreeNode {
  animal: PedigreeAnimal | null;
  father: PedigreeNode | null;
  mother: PedigreeNode | null;
}

/**
 * Maps a full animal row to the compact PedigreeAnimal shape.
 * Converts Date fields to ISO date strings for JSON serialisation.
 */
function toPedigreeAnimal(row: typeof animals.$inferSelect): PedigreeAnimal {
  return {
    id: row.id,
    rfid: row.rfid,
    name: row.name,
    breed: row.breed,
    sex: row.sex,
    birthDate: row.birthDate ? new Date(row.birthDate).toISOString().split("T")[0] : null,
    weight: row.weight,
    bcs: row.bcs,
    healthStatus: row.healthStatus,
    photoUrl: row.photoUrl,
  };
}

/**
 * Recursively builds a pedigree node for the given animal ID.
 *
 * @param id              The animal to look up.
 * @param generation      Current generation index (0 = subject, 1 = parents, …).
 * @param maxGenerations  How many generations to traverse (3 = subject + parents + grandparents).
 * @param visited         Set of already-visited IDs to prevent infinite loops on circular references.
 */
async function buildPedigreeNode(
  id: number,
  generation: number,
  maxGenerations: number,
  visited: Set<number>
): Promise<PedigreeNode> {
  // Stop if we've reached the generation limit or hit a cycle.
  if (generation >= maxGenerations || visited.has(id)) {
    return { animal: null, father: null, mother: null };
  }

  visited.add(id);
  const row = await findAnimalById(id);
  visited.delete(id);

  if (!row) {
    return { animal: null, father: null, mother: null };
  }

  const father = row.fatherId
    ? await buildPedigreeNode(row.fatherId, generation + 1, maxGenerations, visited)
    : null;

  const mother = row.motherId
    ? await buildPedigreeNode(row.motherId, generation + 1, maxGenerations, visited)
    : null;

  return {
    animal: toPedigreeAnimal(row),
    father,
    mother,
  };
}

/**
 * Builds the complete pedigree tree for an animal (up to 3 generations).
 *
 * @param animalId       The subject animal.
 * @param maxGenerations Number of generations to include (default 3).
 * @returns              The root PedigreeNode, or null if the animal doesn't exist.
 */
export async function getPedigreeTree(
  animalId: number,
  maxGenerations: number = 3
): Promise<PedigreeNode | null> {
  const subject = await findAnimalById(animalId);
  if (!subject) {
    return null;
  }

  const visited = new Set<number>();
  visited.add(subject.id);

  const father = subject.fatherId
    ? await buildPedigreeNode(subject.fatherId, 1, maxGenerations, visited)
    : null;

  const mother = subject.motherId
    ? await buildPedigreeNode(subject.motherId, 1, maxGenerations, visited)
    : null;

  return {
    animal: toPedigreeAnimal(subject),
    father,
    mother,
  };
}
