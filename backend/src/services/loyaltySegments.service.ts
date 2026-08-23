import {
  findClientSegmentById,
  createClientSegment as createClientSegmentInDb,
  updateClientSegment as updateClientSegmentInDb,
  deleteClientSegment as deleteClientSegmentInDb,
  listClientSegments as listClientSegmentsInDb,
} from "../repositories/loyalty.repository.js";

export type CreateClientSegmentResult =
  | {
      success: true;
      status: 201;
      segment: NonNullable<Awaited<ReturnType<typeof findClientSegmentById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createClientSegment(input: {
  name: string;
  description?: string | null;
  minScore?: number;
  maxScore?: number;
  minFrequency?: number;
  maxFrequency?: number | null;
  minBasket?: number;
  maxBasket?: number | null;
  color?: string;
  isActive?: boolean;
}): Promise<CreateClientSegmentResult> {
  const segment = await createClientSegmentInDb({
    name: input.name,
    description: input.description ?? undefined,
    minScore: input.minScore ?? 0,
    maxScore: input.maxScore ?? 100,
    minFrequency: input.minFrequency ?? 0,
    maxFrequency: input.maxFrequency ?? undefined,
    minBasket: String(input.minBasket ?? 0),
    maxBasket: input.maxBasket != null ? String(input.maxBasket) : undefined,
    color: input.color ?? "#15803D",
    isActive: input.isActive ?? true,
  });
  if (!segment) {
    return { success: false, status: 400, message: "Erreur lors de la création du segment." };
  }
  return { success: true, status: 201, segment };
}

export type UpdateClientSegmentResult =
  | {
      success: true;
      status: 200;
      segment: NonNullable<Awaited<ReturnType<typeof findClientSegmentById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateClientSegment(
  id: number,
  input: {
    name?: string;
    description?: string | null;
    minScore?: number;
    maxScore?: number;
    minFrequency?: number;
    maxFrequency?: number | null;
    minBasket?: number;
    maxBasket?: number | null;
    color?: string;
    isActive?: boolean;
  }
): Promise<UpdateClientSegmentResult> {
  const existing = await findClientSegmentById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Segment introuvable." };
  }

  const updated = await updateClientSegmentInDb(id, {
    name: input.name,
    description: input.description,
    minScore: input.minScore,
    maxScore: input.maxScore,
    minFrequency: input.minFrequency,
    maxFrequency: input.maxFrequency,
    minBasket: input.minBasket != null ? String(input.minBasket) : undefined,
    maxBasket: input.maxBasket != null ? String(input.maxBasket) : undefined,
    color: input.color,
    isActive: input.isActive,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Segment introuvable." };
  }
  return { success: true, status: 200, segment: updated };
}

export type GetClientSegmentResult =
  | {
      success: true;
      status: 200;
      segment: NonNullable<Awaited<ReturnType<typeof findClientSegmentById>>>;
    }
  | { success: false; status: 404; message: string };

export async function getClientSegmentById(id: number): Promise<GetClientSegmentResult> {
  const segment = await findClientSegmentById(id);
  if (!segment) {
    return { success: false, status: 404, message: "Segment introuvable." };
  }
  return { success: true, status: 200, segment };
}

export async function listClientSegments(params: {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}) {
  const { rows, total } = await listClientSegmentsInDb(params);
  return {
    success: true,
    status: 200,
    segments: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export type DeleteClientSegmentResult =
  | {
      success: true;
      status: 200;
      message: string;
    }
  | { success: false; status: 404; message: string };

export async function deleteClientSegment(id: number): Promise<DeleteClientSegmentResult> {
  const existing = await findClientSegmentById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Segment introuvable." };
  }
  await deleteClientSegmentInDb(id);
  return { success: true, status: 200, message: "Segment supprimé." };
}
