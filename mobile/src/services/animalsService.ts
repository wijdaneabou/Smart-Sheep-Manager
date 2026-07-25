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
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

function extractError(err: any): string {
    console.log("FULL ERROR RESPONSE DATA:", JSON.stringify(err?.response?.data, null, 2));
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

export async function listAnimals(
  params: { page?: number; limit?: number; search?: string; breed?: string; sex?: string; healthStatus?: string } = {}
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
  fatherId?: number;
  motherId?: number;
  weight?: number;
  bcs?: number;
  healthStatus?: HealthStatus;
  exploitationId?: number;
}) {
  try {
    const response = await api.post<{ data: Animal }>("/animals", input);
    return { success: true as const, animal: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
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
    fatherId: number | null;
    motherId: number | null;
    weight: number | null;
    bcs: number | null;
    healthStatus: HealthStatus;
    exploitationId: number | null;
  }>
) {
  try {
    const response = await api.put<{ data: Animal }>(`/animals/${id}`, input);
    return { success: true as const, animal: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
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
