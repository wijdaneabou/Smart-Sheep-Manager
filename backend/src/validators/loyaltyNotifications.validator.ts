import { z } from "zod";

export const NOTIFICATION_TYPES = ["AVAILABILITY", "PRICE_DROP", "NEW_ARRIVAL"] as const;

export const createLoyaltyNotificationSchema = z.object({
  title: z.string().min(1, "Le titre est requis.").max(150),
  message: z.string().min(1, "Le message est requis."),
  type: z.enum(NOTIFICATION_TYPES),
  clientId: z.coerce.number().int().positive().optional().nullable(),
  segmentId: z.coerce.number().int().positive().optional().nullable(),
});

export const listLoyaltyNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  clientId: z.coerce.number().int().positive().optional(),
  segmentId: z.coerce.number().int().positive().optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
});
