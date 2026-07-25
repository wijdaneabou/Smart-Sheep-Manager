import {
  findAnimalById,
  findAnimalByRfid,
  createAnimal as createAnimalInDb,
  updateAnimal as updateAnimalInDb,
  deleteAnimal as deleteAnimalInDb,
  listAnimals as listAnimalsInDb,
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
