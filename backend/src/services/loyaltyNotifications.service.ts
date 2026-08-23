import {
  findLoyaltyNotificationById,
  createLoyaltyNotification as createLoyaltyNotificationInDb,
  markNotificationAsRead as markNotificationAsReadInDb,
  listLoyaltyNotifications as listLoyaltyNotificationsInDb,
} from "../repositories/loyalty.repository.js";

export type CreateLoyaltyNotificationResult =
  | {
      success: true;
      status: 201;
      notification: NonNullable<Awaited<ReturnType<typeof findLoyaltyNotificationById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createLoyaltyNotification(input: {
  title: string;
  message: string;
  type: "AVAILABILITY" | "PRICE_DROP" | "NEW_ARRIVAL";
  clientId?: number | null;
  segmentId?: number | null;
}): Promise<CreateLoyaltyNotificationResult> {
  const notification = await createLoyaltyNotificationInDb({
    title: input.title,
    message: input.message,
    type: input.type,
    clientId: input.clientId ?? undefined,
    segmentId: input.segmentId ?? undefined,
  });
  if (!notification) {
    return { success: false, status: 400, message: "Erreur lors de la création de la notification." };
  }
  return { success: true, status: 201, notification };
}

export async function markLoyaltyNotificationAsRead(id: number) {
  const notification = await markNotificationAsReadInDb(id);
  if (!notification) {
    return { success: false as const, status: 404, message: "Notification introuvable." };
  }
  return { success: true as const, status: 200, notification };
}

export async function listLoyaltyNotifications(params: {
  page: number;
  limit: number;
  type?: string;
  clientId?: number;
  segmentId?: number;
  unreadOnly?: boolean;
}) {
  const { rows, total } = await listLoyaltyNotificationsInDb(params);
  return {
    success: true,
    status: 200,
    notifications: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
