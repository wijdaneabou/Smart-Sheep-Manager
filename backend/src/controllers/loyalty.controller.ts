import { z } from "zod";
import type { Context } from "hono";
import {
  createClientSegmentSchema,
  updateClientSegmentSchema,
  listClientSegmentsQuerySchema,
} from "../validators/loyalty.validator.js";
import * as segmentsService from "../services/loyaltySegments.service.js";
import * as offersService from "../services/loyaltyOffers.service.js";
import * as notificationsService from "../services/loyaltyNotifications.service.js";
import * as profilesService from "../services/loyaltyProfiles.service.js";

// ---- Segments ----

export async function createSegmentHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createClientSegmentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const result = await segmentsService.createClientSegment(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.segment }, 201);
}

export async function updateSegmentHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);
  const body = await c.req.json();
  const parsed = updateClientSegmentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const result = await segmentsService.updateClientSegment(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.segment }, 200);
}

export async function getSegmentHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);
  const result = await segmentsService.getClientSegmentById(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.segment }, 200);
}

export async function listSegmentsHandler(c: Context) {
  const parsed = listClientSegmentsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const result = await segmentsService.listClientSegments(parsed.data);
  return c.json({ data: result.segments, pagination: result.pagination }, 200);
}

export async function deleteSegmentHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);
  const result = await segmentsService.deleteClientSegment(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, 200);
}

// ---- Offers ----

export async function createOfferHandler(c: Context) {
  const body = await c.req.json();
  const parsed = (await import("../validators/loyaltyOffers.validator.js")).createLoyaltyOfferSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const { validFrom, validTo, ...rest } = parsed.data;
  const result = await offersService.createLoyaltyOffer({
    ...rest,
    validFrom: new Date(validFrom),
    validTo: new Date(validTo),
  });
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.offer }, 201);
}

export async function updateOfferHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);
  const body = await c.req.json();
  const parsed = (await import("../validators/loyaltyOffers.validator.js")).updateLoyaltyOfferSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const { validFrom, validTo, ...rest } = parsed.data;
  const result = await offersService.updateLoyaltyOffer(id, {
    ...rest,
    ...(validFrom ? { validFrom: new Date(validFrom) } : {}),
    ...(validTo ? { validTo: new Date(validTo) } : {}),
  });
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.offer }, 200);
}

export async function getOfferHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);
  const result = await offersService.getLoyaltyOfferById(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.offer }, 200);
}

export async function listOffersHandler(c: Context) {
  const parsed = (await import("../validators/loyaltyOffers.validator.js")).listLoyaltyOffersQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const result = await offersService.listLoyaltyOffers(parsed.data);
  return c.json({ data: result.offers, pagination: result.pagination }, 200);
}

export async function deleteOfferHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);
  const result = await offersService.deleteLoyaltyOffer(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, 200);
}

// ---- Notifications ----

export async function createNotificationHandler(c: Context) {
  const body = await c.req.json();
  const parsed = (await import("../validators/loyaltyNotifications.validator.js")).createLoyaltyNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const result = await notificationsService.createLoyaltyNotification(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.notification }, 201);
}

export async function listNotificationsHandler(c: Context) {
  const parsed = (await import("../validators/loyaltyNotifications.validator.js")).listLoyaltyNotificationsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const result = await notificationsService.listLoyaltyNotifications(parsed.data);
  return c.json({ data: result.notifications, pagination: result.pagination }, 200);
}

export async function markNotificationReadHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);
  const result = await notificationsService.markLoyaltyNotificationAsRead(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status as any);
  }
  return c.json({ data: result.notification }, 200);
}

// ---- Profiles ----

export async function listProfilesHandler(c: Context) {
  const parsed = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    segmentId: z.coerce.number().int().positive().optional(),
  }).safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const result = await profilesService.listLoyaltyProfiles(parsed.data);
  return c.json({ data: result.profiles, pagination: result.pagination }, 200);
}
