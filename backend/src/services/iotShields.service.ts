import {
  findIotShieldById,
  findIotShieldBySsmIotNumber,
  createIotShield as createIotShieldInDb,
  updateIotShield as updateIotShieldInDb,
  deleteIotShield as deleteIotShieldInDb,
  listIotShields as listIotShieldsInDb,
  associateAnimalToShield as associateAnimalInDb,
  updateBattery as updateBatteryInDb,
  toggleStatus as toggleStatusInDb,
} from "../repositories/iotShields.repository.js";
import { findAnimalById } from "../repositories/animals.repository.js";
import { findExploitationByOwnerId } from "../repositories/exploitations.repository.js";
import { generateApiKey } from "../utils/generateApiKey.js";

type ShieldRow = NonNullable<Awaited<ReturnType<typeof findIotShieldById>>>;

function serializeShield(shield: ShieldRow) {
  return {
    id: shield.id,
    ssmIotNumber: shield.ssmIotNumber,
    apiKey: shield.apiKey,
    sensorType: shield.sensorType,
    battery: shield.battery,
    animalId: shield.animalId,
    animal: shield.animal
      ? {
          id: shield.animal.id,
          rfid: shield.animal.rfid,
          name: shield.animal.name,
          breed: shield.animal.breed,
          sex: shield.animal.sex,
        }
      : null,
    status: shield.status,
    exploitationId: shield.exploitationId,
    exploitation: shield.exploitation
      ? {
          id: shield.exploitation.id,
          name: shield.exploitation.name,
        }
      : null,
    createdAt: shield.createdAt,
    updatedAt: shield.updatedAt,
  };
}

export type SerializedShield = ReturnType<typeof serializeShield>;

export type CreateIotShieldResult =
  | { success: true; status: 201; shield: SerializedShield }
  | { success: false; status: 400; message: string };

export async function createIotShield(input: {
  ssmIotNumber: string;
  sensorType: string;
  battery?: number;
  animalId?: number | null;
  status?: "ACTIVE" | "INACTIVE";
  exploitationId?: number | null;
},
ownerId: number
): Promise<CreateIotShieldResult> {
  const existing = await findIotShieldBySsmIotNumber(input.ssmIotNumber);
  if (existing) {
    return {
      success: false,
      status: 400,
      message: "Un bouclier avec ce numéro SSM-IOT existe déjà.",
    };
  }

  if (input.animalId) {
    const animal = await findAnimalById(input.animalId);
    if (!animal) {
      return {
        success: false,
        status: 400,
        message: "L'animal associé est introuvable.",
      };
    }
  }

  const exploitation = await findExploitationByOwnerId(ownerId);

  if (!exploitation) {
    return {
      success: false,
      status: 400,
      message: "Aucune exploitation n'est associée à cet utilisateur.",
    };
  }

  const apiKey = generateApiKey();

  const shield = await createIotShieldInDb({
    ssmIotNumber: input.ssmIotNumber,
    apiKey,
    sensorType: input.sensorType as any,
    battery: input.battery !== undefined ? String(input.battery) : undefined,
    animalId: input.animalId ?? undefined,
    status: input.status ?? "ACTIVE",
    exploitationId: exploitation.id,
  });

  if (!shield) {
    return { success: false, status: 400, message: "Erreur lors de la création." };
  }

  return { success: true, status: 201, shield: serializeShield(shield) };
}

export type UpdateIotShieldResult =
  | { success: true; status: 200; shield: SerializedShield }
  | { success: false; status: 400; message: string }
  | { success: false; status: 404; message: string };

export async function updateIotShield(
  id: number,
  input: {
    ssmIotNumber?: string;
    sensorType?: string;
    battery?: number | null;
    animalId?: number | null;
    status?: "ACTIVE" | "INACTIVE";
    exploitationId?: number | null;
  }
): Promise<UpdateIotShieldResult> {
  const existing = await findIotShieldById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  if (input.ssmIotNumber && input.ssmIotNumber !== existing.ssmIotNumber) {
    const ssmOwner = await findIotShieldBySsmIotNumber(input.ssmIotNumber);
    if (ssmOwner) {
      return {
        success: false,
        status: 400,
        message: "Un bouclier avec ce numéro SSM-IOT existe déjà.",
      };
    }
  }

  if (input.animalId !== undefined && input.animalId !== null) {
    const animal = await findAnimalById(input.animalId);
    if (!animal) {
      return {
        success: false,
        status: 400,
        message: "L'animal associé est introuvable.",
      };
    }
  }

  const updated = await updateIotShieldInDb(id, {
    ssmIotNumber: input.ssmIotNumber,
    sensorType: input.sensorType as any,
    battery:
      input.battery !== undefined
        ? input.battery === null
          ? undefined
          : String(input.battery)
        : undefined,
    animalId: input.animalId ?? undefined,
    status: input.status,
    exploitationId: input.exploitationId ?? undefined,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  return { success: true, status: 200, shield: serializeShield(updated) };
}

export type GetIotShieldResult =
  | { success: true; status: 200; shield: SerializedShield }
  | { success: false; status: 404; message: string };

export async function getIotShieldById(id: number): Promise<GetIotShieldResult> {
  const shield = await findIotShieldById(id);
  if (!shield) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }
  return { success: true, status: 200, shield: serializeShield(shield) };
}

export type DeleteIotShieldResult =
  | { success: true; status: 200 }
  | { success: false; status: 404; message: string };

export async function deleteIotShield(id: number): Promise<DeleteIotShieldResult> {
  const existing = await findIotShieldById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }
  await deleteIotShieldInDb(id);
  return { success: true, status: 200 };
}

export async function listIotShields(params: {
  exploitationId?: number;
  page: number;
  limit: number;
  search?: string;
  sensorType?: string;
  status?: string;
}) {
  const { rows, total } = await listIotShieldsInDb(params);
  return {
    success: true as const,
    status: 200 as const,
    shields: rows.map((row) => ({
      id: row.id,
      ssmIotNumber: row.ssmIotNumber,
      sensorType: row.sensorType,
      battery: row.battery,
      animalId: row.animalId,
      status: row.status,
      exploitationId: row.exploitationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      animal: row.animal?.id
        ? {
            id: row.animal.id,
            rfid: row.animal.rfid,
            name: row.animal.name,
            breed: row.animal.breed,
            sex: row.animal.sex,
          }
        : null,
    })),
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function associateAnimal(
  shieldId: number,
  animalId: number | null
): Promise<UpdateIotShieldResult> {
  const existing = await findIotShieldById(shieldId);
  if (!existing) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  if (animalId !== null) {
    const animal = await findAnimalById(animalId);
    if (!animal) {
      return {
        success: false,
        status: 400,
        message: "L'animal associé est introuvable.",
      };
    }
  }

  const updated = await associateAnimalInDb(shieldId, animalId);
  if (!updated) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  return { success: true, status: 200, shield: serializeShield(updated) };
}

export async function updateBatteryLevel(
  shieldId: number,
  battery: number
): Promise<UpdateIotShieldResult> {
  const existing = await findIotShieldById(shieldId);
  if (!existing) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  if (battery < 0 || battery > 100) {
    return {
      success: false,
      status: 400,
      message: "La batterie doit être entre 0 et 100.",
    };
  }

  const updated = await updateBatteryInDb(shieldId, battery);
  if (!updated) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  return { success: true, status: 200, shield: serializeShield(updated) };
}

export async function toggleShieldStatus(
  shieldId: number
): Promise<UpdateIotShieldResult> {
  const existing = await findIotShieldById(shieldId);
  if (!existing) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  const updated = await toggleStatusInDb(shieldId);
  if (!updated) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  return { success: true, status: 200, shield: serializeShield(updated) };
}