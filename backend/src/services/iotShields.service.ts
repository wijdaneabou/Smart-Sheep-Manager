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
import { generateApiKey } from "../utils/generateApiKey.js";
import { getUserExploitationIdsWithAdmin } from "../utils/userHelpers.js";

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

// ── Helpers ──

async function shieldBelongsToUser(shieldId: number, user: any): Promise<boolean> {
  const shield = await findIotShieldById(shieldId);
  if (!shield) return false;
  if (user.roleName?.toLowerCase() === 'admin') return true;
  const userExploitationIds = await getUserExploitationIdsWithAdmin(user);
  if (!userExploitationIds || userExploitationIds.length === 0) return false;
  return userExploitationIds.includes(shield.exploitationId!);
}

// ✅ Check if an animal belongs to a specific exploitation
async function animalBelongsToExploitation(animalId: number, exploitationId: number): Promise<boolean> {
  const animal = await findAnimalById(animalId);
  if (!animal) return false;
  return animal.exploitationId === exploitationId;
}

// ── CREATE ──

export type CreateIotShieldResult =
  | { success: true; status: 201; shield: SerializedShield }
  | { success: false; status: 400; message: string }
  | { success: false; status: 403; message: string };

export async function createIotShield(
  input: {
    ssmIotNumber: string;
    sensorType: string;
    battery?: number;
    animalId?: number | null;
    status?: "ACTIVE" | "INACTIVE";
    exploitationId?: number | null;
  },
  user: any
): Promise<CreateIotShieldResult> {
  console.log("[createIotShield] Received user:", user);
  console.log("[createIotShield] Input:", input);

  const existing = await findIotShieldBySsmIotNumber(input.ssmIotNumber);
  if (existing) {
    return {
      success: false,
      status: 400,
      message: "Un bouclier avec ce numéro SSM-IOT existe déjà.",
    };
  }

  // ── Determine exploitationId ──

  let exploitationId: number | null = null;

  if (user.roleName?.toLowerCase() === 'admin') {
    console.log("[createIotShield] User is admin, requiring exploitationId.");
    if (!input.exploitationId) {
      return {
        success: false,
        status: 400,
        message: "Veuillez spécifier une exploitation pour ce bouclier.",
      };
    }
    exploitationId = input.exploitationId;
  } else {
    // Non-admin: get user's exploitations
    console.log("[createIotShield] Getting exploitations for non-admin user.");
    const userExploitationIds = await getUserExploitationIdsWithAdmin(user);
    console.log("[createIotShield] userExploitationIds:", userExploitationIds);

    if (!userExploitationIds || userExploitationIds.length === 0) {
      return {
        success: false,
        status: 400,
        message: "Aucune exploitation associée à cet utilisateur.",
      };
    }

    if (userExploitationIds.length === 1) {
      exploitationId = userExploitationIds[0];
      console.log("[createIotShield] Single exploitation, auto-assigning:", exploitationId);
    } else {
      if (!input.exploitationId) {
        return {
          success: false,
          status: 400,
          message: "Vous avez plusieurs exploitations. Veuillez en choisir une.",
        };
      }
      if (!userExploitationIds.includes(input.exploitationId)) {
        return {
          success: false,
          status: 403,
          message: "Vous n'avez pas accès à cette exploitation.",
        };
      }
      exploitationId = input.exploitationId;
      console.log("[createIotShield] Multiple exploitations, user chose:", exploitationId);
    }
  }

  // ── Validate animal belongs to the chosen exploitation ──

  if (input.animalId) {
    const animal = await findAnimalById(input.animalId);
    if (!animal) {
      return {
        success: false,
        status: 400,
        message: "L'animal associé est introuvable.",
      };
    }
    if (!(await animalBelongsToExploitation(input.animalId, exploitationId!))) {
      return {
        success: false,
        status: 403,
        message: "Cet animal n'appartient pas à l'exploitation sélectionnée.",
      };
    }
  }

  // ── Create shield ──

  const apiKey = generateApiKey();

  const shield = await createIotShieldInDb({
    ssmIotNumber: input.ssmIotNumber,
    apiKey,
    sensorType: input.sensorType as any,
    battery: input.battery !== undefined ? String(input.battery) : undefined,
    animalId: input.animalId ?? undefined,
    status: input.status ?? "ACTIVE",
    exploitationId: exploitationId!,
  });

  if (!shield) {
    return { success: false, status: 400, message: "Erreur lors de la création." };
  }

  return { success: true, status: 201, shield: serializeShield(shield) };
}

// ── UPDATE ──

export type UpdateIotShieldResult =
  | { success: true; status: 200; shield: SerializedShield }
  | { success: false; status: 400; message: string }
  | { success: false; status: 403; message: string }
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
  },
  user: any
): Promise<UpdateIotShieldResult> {
  if (!(await shieldBelongsToUser(id, user))) {
    return { success: false, status: 403, message: "Accès interdit à ce bouclier." };
  }

  const existing = await findIotShieldById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  // If exploitationId is being changed, validate access
  if (input.exploitationId !== undefined && input.exploitationId !== null) {
    if (user.roleName?.toLowerCase() !== 'admin') {
      const userExploitationIds = await getUserExploitationIdsWithAdmin(user);
      if (!userExploitationIds || !userExploitationIds.includes(input.exploitationId)) {
        return { success: false, status: 403, message: "Vous n'avez pas accès à cette exploitation." };
      }
    }
  }

  // If animal is changed, validate it belongs to the (new) exploitation
  if (input.animalId !== undefined && input.animalId !== null) {
    const targetExploitation = input.exploitationId ?? existing.exploitationId;
    if (!(await animalBelongsToExploitation(input.animalId, targetExploitation!))) {
      return {
        success: false,
        status: 403,
        message: "Cet animal n'appartient pas à l'exploitation du bouclier.",
      };
    }
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

// ── GET BY ID ──

export type GetIotShieldResult =
  | { success: true; status: 200; shield: SerializedShield }
  | { success: false; status: 403; message: string }
  | { success: false; status: 404; message: string };

export async function getIotShieldById(id: number, user: any): Promise<GetIotShieldResult> {
  const shield = await findIotShieldById(id);
  if (!shield) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }
  if (!(await shieldBelongsToUser(id, user))) {
    return { success: false, status: 403, message: "Accès interdit à ce bouclier." };
  }
  return { success: true, status: 200, shield: serializeShield(shield) };
}

// ── DELETE ──

export type DeleteIotShieldResult =
  | { success: true; status: 200 }
  | { success: false; status: 403; message: string }
  | { success: false; status: 404; message: string };

export async function deleteIotShield(id: number, user: any): Promise<DeleteIotShieldResult> {
  if (!(await shieldBelongsToUser(id, user))) {
    return { success: false, status: 403, message: "Accès interdit à ce bouclier." };
  }
  const existing = await findIotShieldById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }
  await deleteIotShieldInDb(id);
  return { success: true, status: 200 };
}

// ── LIST ──

export async function listIotShields(
  user: any,
  params: {
    page: number;
    limit: number;
    search?: string;
    sensorType?: string;
    status?: string;
  }
) {
  const exploitationIds = await getUserExploitationIdsWithAdmin(user);

  if (exploitationIds !== null && exploitationIds.length === 0) {
    return {
      success: true as const,
      status: 200 as const,
      shields: [],
      pagination: {
        total: 0,
        page: params.page,
        limit: params.limit,
        totalPages: 0,
      },
    };
  }

  const { rows, total } = await listIotShieldsInDb({
    exploitationIds,
    ...params,
  });

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

// ── ASSOCIATE ANIMAL ──

export async function associateAnimal(
  shieldId: number,
  animalId: number | null,
  user: any
): Promise<UpdateIotShieldResult> {
  if (!(await shieldBelongsToUser(shieldId, user))) {
    return { success: false, status: 403, message: "Accès interdit à ce bouclier." };
  }
  const existing = await findIotShieldById(shieldId);
  if (!existing) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  if (animalId !== null) {
    if (!(await animalBelongsToExploitation(animalId, existing.exploitationId!))) {
      return {
        success: false,
        status: 403,
        message: "Cet animal n'appartient pas à l'exploitation du bouclier.",
      };
    }
  }

  const updated = await associateAnimalInDb(shieldId, animalId);
  if (!updated) {
    return { success: false, status: 404, message: "Bouclier IoT introuvable." };
  }

  return { success: true, status: 200, shield: serializeShield(updated) };
}

// ── UPDATE BATTERY ──

export async function updateBatteryLevel(
  shieldId: number,
  battery: number,
  user: any
): Promise<UpdateIotShieldResult> {
  if (!(await shieldBelongsToUser(shieldId, user))) {
    return { success: false, status: 403, message: "Accès interdit à ce bouclier." };
  }
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

// ── TOGGLE STATUS ──

export async function toggleShieldStatus(
  shieldId: number,
  user: any
): Promise<UpdateIotShieldResult> {
  if (!(await shieldBelongsToUser(shieldId, user))) {
    return { success: false, status: 403, message: "Accès interdit à ce bouclier." };
  }
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