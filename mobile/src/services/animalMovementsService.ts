import api from "./api";

export type MovementType = "ENTRY" | "EXIT" | "DEATH" | "SALE" | "PURCHASE";

export interface AnimalMovement {
  id: number;
  animalId: number;
  type: MovementType;
  date: string;
  reason: string | null;
  sourceDestination: string | null;
  price: string | null;
  createdAt: string;
}

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

/**
 * Récupère la liste des mouvements de troupeau.
 */
export async function listMovements(
  params: {
    page?: number;
    limit?: number;
    animalId?: number;
    type?: MovementType;
    from?: string;
    to?: string;
  } = {}
) {
  try {
    const response = await api.get<{
      data: AnimalMovement[];
      pagination: Pagination;
    }>("/movements", { params });
    return {
      success: true as const,
      movements: response.data.data,
      pagination: response.data.pagination,
    };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Crée un nouveau mouvement de troupeau.
 */
export async function createMovement(input: {
  animalId: number;
  type: MovementType;
  date: string;
  reason?: string;
  sourceDestination?: string;
  price?: number;
}) {
  try {
    const response = await api.post<{ data: AnimalMovement }>("/movements", input);
    return { success: true as const, movement: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
