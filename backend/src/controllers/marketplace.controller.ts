import type { Context } from "hono";
import {
  createListingSchema,
  updateListingSchema,
  listListingsQuerySchema,
  createMessageSchema,
  listMessagesQuerySchema,
  createRatingSchema,
  listRatingsQuerySchema,
  createTransactionSchema,
  updateTransactionSchema,
} from "../validators/marketplace.validator.js";
import * as marketplaceService from "../services/marketplace.service.js";

export async function createListingHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await marketplaceService.createListing(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.listing }, 201);
}

export async function updateListingHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const parsed = updateListingSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await marketplaceService.updateListing(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.listing }, 200);
}

export async function getListingHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await marketplaceService.getListing(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.listing }, 200);
}

export async function listListingsHandler(c: Context) {
  const parsed = listListingsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await marketplaceService.searchListings(parsed.data);
  return c.json(
    {
      data: result.listings,
      pagination: result.pagination,
    },
    200
  );
}

export async function deleteListingHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await marketplaceService.deleteListing(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, 200);
}

export async function createMessageHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await marketplaceService.sendMessage(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.message }, 201);
}

export async function listMessagesHandler(c: Context) {
  const parsed = listMessagesQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await marketplaceService.getMessages(parsed.data);
  return c.json(
    {
      data: result.messages,
      pagination: result.pagination,
    },
    200
  );
}

export async function markMessageReadHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  await marketplaceService.markMessageRead(id);
  return c.json({ message: "Message marqué comme lu." }, 200);
}

export async function createRatingHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createRatingSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await marketplaceService.submitRating(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.rating }, 201);
}

export async function listRatingsHandler(c: Context) {
  const parsed = listRatingsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await marketplaceService.getRatings(parsed.data);
  return c.json(
    {
      data: result.ratings,
      pagination: result.pagination,
    },
    200
  );
}

export async function createTransactionHandler(c: Context) {
  const body = await c.req.json();
  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await marketplaceService.createTransaction(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.transaction }, 201);
}

export async function updateTransactionHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();
  const parsed = updateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await marketplaceService.updateTransaction(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.transaction }, 200);
}

export async function getTransactionHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await marketplaceService.getTransaction(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.transaction }, 200);
}
