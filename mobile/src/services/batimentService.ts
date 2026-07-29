import api from "./api";

export type BatimentType = "BERGERIE" | "STABULATION" | "BOX" | "PARC" | "PARCELLE";
export type BatimentEtat = "BON" | "MOYEN" | "MAUVAIS";

export type Batiment = {
  id: number;
  exploitationId: number;
  name: string;
  type: BatimentType;
  capacite: number | null;
  superficie: string | null;
  equipements: string[];
  etat: BatimentEtat;
  occupationActuelle: number;
  createdAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

function extractError(err: any): string {
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

export async function listBatiments(params: {
  exploitationId: number;
  page?: number;
  limit?: number;
  type?: BatimentType;
}) {
  try {
    const response = await api.get<{ data: Batiment[]; pagination: Pagination }>(
      "/batiments",
      { params }
    );
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getBatimentById(id: number) {
  try {
    const response = await api.get<{ data: Batiment }>(`/batiments/${id}`);
    return { success: true as const, batiment: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createBatiment(input: {
  exploitationId: number;
  name: string;
  type: BatimentType;
  capacite?: number;
  superficie?: number;
  equipements?: string[];
  etat: BatimentEtat;
  occupationActuelle: number;
}) {
  try {
    const response = await api.post<{ data: Batiment }>("/batiments", input);
    return { success: true as const, batiment: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function updateBatiment(
  id: number,
  input: Partial<{
    name: string;
    type: BatimentType;
    capacite: number;
    superficie: number;
    equipements: string[];
    etat: BatimentEtat;
    occupationActuelle: number;
  }>
) {
  try {
    const response = await api.put<{ data: Batiment }>(`/batiments/${id}`, input);
    return { success: true as const, batiment: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function deleteBatiment(id: number) {
  try {
    await api.delete(`/batiments/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}