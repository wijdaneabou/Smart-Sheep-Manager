import api from "./api";

export type MovementType =
  | "ENTRY"
  | "EXIT"
  | "DEATH"
  | "SALE"
  | "PURCHASE";

 export interface AnimalMovement {
  id: number;
  animalId: number;
  animalRfid: string | null;
  animalName: string | null;
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
  console.log("========== AXIOS ERROR ==========");
  console.log(err);
  console.log("status :", err?.response?.status);
  console.log("data :", err?.response?.data);
  console.log("message :", err?.message);
  console.log("================================");

  const apiError = err?.response?.data?.error;

  if (typeof apiError === "string") {
    return apiError;
  }

  return (
    err?.response?.data?.message ??
    err?.message ??
    "Impossible de contacter le serveur."
  );
}

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
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function createMovement(input: {
  animalId: number;
  type: MovementType;
  date: string;
  reason?: string;
  sourceDestination?: string;
  price?: number;
}) {
  try {
    console.log("===== REQUEST =====");
    console.log(input);

    const response = await api.post<{
      data: AnimalMovement;
    }>("/movements", input);

    console.log("===== RESPONSE =====");
    console.log(response.status);
    console.log(response.data);

    return {
      success: true as const,
      movement: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}