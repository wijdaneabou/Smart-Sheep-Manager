import { Hono } from "hono";
import {
  createListingHandler,
  updateListingHandler,
  getListingHandler,
  listListingsHandler,
  deleteListingHandler,
  createMessageHandler,
  listMessagesHandler,
  markMessageReadHandler,
  createRatingHandler,
  listRatingsHandler,
  createTransactionHandler,
  updateTransactionHandler,
  getTransactionHandler,
} from "../controllers/marketplace.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const marketplaceRoutes = new Hono();

marketplaceRoutes.use("*", isAuthenticated);

marketplaceRoutes.post("/listings", requirePermission("MARKETPLACE", "CREATE"), createListingHandler);
marketplaceRoutes.put("/listings/:id", requirePermission("MARKETPLACE", "UPDATE"), updateListingHandler);
marketplaceRoutes.get("/listings/:id", requirePermission("MARKETPLACE", "READ"), getListingHandler);
marketplaceRoutes.get("/listings", requirePermission("MARKETPLACE", "READ"), listListingsHandler);
marketplaceRoutes.delete("/listings/:id", requirePermission("MARKETPLACE", "DELETE"), deleteListingHandler);

marketplaceRoutes.post("/messages", requirePermission("MARKETPLACE", "CREATE"), createMessageHandler);
marketplaceRoutes.get("/messages", requirePermission("MARKETPLACE", "READ"), listMessagesHandler);
marketplaceRoutes.patch("/messages/:id/read", requirePermission("MARKETPLACE", "UPDATE"), markMessageReadHandler);

marketplaceRoutes.post("/ratings", requirePermission("MARKETPLACE", "CREATE"), createRatingHandler);
marketplaceRoutes.get("/ratings", requirePermission("MARKETPLACE", "READ"), listRatingsHandler);

marketplaceRoutes.post("/transactions", requirePermission("MARKETPLACE", "CREATE"), createTransactionHandler);
marketplaceRoutes.put("/transactions/:id", requirePermission("MARKETPLACE", "UPDATE"), updateTransactionHandler);
marketplaceRoutes.get("/transactions/:id", requirePermission("MARKETPLACE", "READ"), getTransactionHandler);

export default marketplaceRoutes;
