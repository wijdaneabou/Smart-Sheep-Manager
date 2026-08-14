import api from "./api";

export type Breed = "Sardi" | "Timahdite" | "D'man" | "Beni-Guil";
export type Sex = "MALE" | "FEMALE";
export type HealthStatus = "HEALTHY" | "SICK" | "RECOVERING" | "DECEASED" | "QUARANTINE";

export type Animal = {
  id: number;
  rfid: string;
  name: string;
  breed: Breed;
  sex: Sex;
  birthDate: string | null;
  fatherId: number | null;
  motherId: number | null;
  weight: string | null;
  bcs: string | null;
  healthStatus: HealthStatus;
  exploitationId: number | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Pedigree / Genealogical Tree
// ─────────────────────────────────────────────────────────────────────────────

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

export interface PedigreeNode {
  animal: PedigreeAnimal | null;
  father: PedigreeNode | null;
  mother: PedigreeNode | null;
}

export interface ConsanguinityAlert {
  animalId: number;
  animalName: string;
  occurrences: number;
  paths: string[];
}

export interface PedigreeResult {
  tree: PedigreeNode;
  consanguinityAlerts: ConsanguinityAlert[];
  hasConsanguinity: boolean;
}

function extractError(err: any): string {
  console.log("FULL ERROR RESPONSE DATA:", JSON.stringify(err?.response?.data, null, 2));
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Updated listAnimals with optional exploitationId filter
// ─────────────────────────────────────────────────────────────────────────────

export async function listAnimals(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    breed?: string;
    sex?: string;
    healthStatus?: string;
    exploitationId?: number;   // ✅ NEW – filter by exploitation
  } = {}
) {
  try {
    const response = await api.get<{
      data: Animal[];
      pagination: Pagination;
    }>("/animals", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD operations (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAnimalById(id: number) {
  try {
    const response = await api.get<{ data: Animal }>(`/animals/${id}`);
    return { success: true as const, animal: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createAnimal(input: {
  rfid: string;
  name: string;
  breed: Breed;
  sex: Sex;
  birthDate?: string;
  fatherRfid?: string;
  motherRfid?: string;
  fatherId?: number;
  motherId?: number;
  weight?: number;
  bcs?: number;
  healthStatus?: HealthStatus;
  exploitationId?: number;
  photoUri?: string;
}) {
  try {
    const formData = new FormData();

    formData.append("rfid", input.rfid);
    formData.append("name", input.name);
    formData.append("breed", input.breed);
    formData.append("sex", input.sex);

    if (input.birthDate) formData.append("birthDate", input.birthDate);
    if (input.weight !== undefined) formData.append("weight", String(input.weight));
    if (input.bcs !== undefined) formData.append("bcs", String(input.bcs));
    if (input.healthStatus) formData.append("healthStatus", input.healthStatus);
    if (input.fatherRfid) formData.append("fatherRfid", input.fatherRfid);
    if (input.motherRfid) formData.append("motherRfid", input.motherRfid);
    if (input.exploitationId !== undefined) formData.append("exploitationId", String(input.exploitationId));

    if (input.photoUri) {
      formData.append("photo", {
        uri: input.photoUri,
        name: "animal.jpg",
        type: "image/jpeg",
      } as any);
    }

    const response = await api.post<{ data: Animal }>(
      "/animals",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return {
      success: true as const,
      animal: response.data.data,
    };
  } catch (err: any) {
    console.log("CREATE ANIMAL ERROR:", JSON.stringify(err?.response?.data ?? err?.message));
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function updateAnimal(
  id: number,
  input: Partial<{
    rfid: string;
    name: string;
    breed: Breed;
    sex: Sex;
    birthDate: string | null;
    fatherRfid: string | null;
    motherRfid: string | null;
    weight: number | null;
    bcs: number | null;
    healthStatus: HealthStatus;
    exploitationId: number | null;
    photoUri: string;
  }>
) {
  try {
    const formData = new FormData();

    if (input.rfid) formData.append("rfid", input.rfid);
    if (input.name) formData.append("name", input.name);
    if (input.breed) formData.append("breed", input.breed);
    if (input.sex) formData.append("sex", input.sex);
    if (input.birthDate) formData.append("birthDate", input.birthDate);
    if (input.weight != null) formData.append("weight", String(input.weight));
    if (input.bcs != null) formData.append("bcs", String(input.bcs));
    if (input.healthStatus) formData.append("healthStatus", input.healthStatus);
    if (input.fatherRfid) formData.append("fatherRfid", input.fatherRfid);
    if (input.motherRfid) formData.append("motherRfid", input.motherRfid);
    if (input.exploitationId != null) formData.append("exploitationId", String(input.exploitationId));

    if (input.photoUri) {
      formData.append("photo", {
        uri: input.photoUri,
        name: "animal.jpg",
        type: "image/jpeg",
      } as any);
    }

    const response = await api.put(
      `/animals/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return {
      success: true as const,
      animal: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function deleteAnimal(id: number) {
  try {
    await api.delete(`/animals/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getPedigree(animalId: number, generations: number = 3) {
  try {
    const response = await api.get<{ data: PedigreeResult }>(
      `/animals/${animalId}/pedigree`,
      { params: { generations } }
    );
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}