import { Hono } from "hono";
import {
  createSegmentHandler,
  updateSegmentHandler,
  getSegmentHandler,
  listSegmentsHandler,
  deleteSegmentHandler,
  createOfferHandler,
  updateOfferHandler,
  getOfferHandler,
  listOffersHandler,
  deleteOfferHandler,
  createNotificationHandler,
  listNotificationsHandler,
  markNotificationReadHandler,
  listProfilesHandler,
} from "../controllers/loyalty.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const crmRoutes = new Hono();

crmRoutes.use("*", isAuthenticated);

crmRoutes.post("/segments", requirePermission("CRM", "CREATE"), createSegmentHandler);
crmRoutes.put("/segments/:id", requirePermission("CRM", "UPDATE"), updateSegmentHandler);
crmRoutes.get("/segments/:id", requirePermission("CRM", "READ"), getSegmentHandler);
crmRoutes.get("/segments", requirePermission("CRM", "READ"), listSegmentsHandler);
crmRoutes.delete("/segments/:id", requirePermission("CRM", "DELETE"), deleteSegmentHandler);

crmRoutes.post("/offers", requirePermission("CRM", "CREATE"), createOfferHandler);
crmRoutes.put("/offers/:id", requirePermission("CRM", "UPDATE"), updateOfferHandler);
crmRoutes.get("/offers/:id", requirePermission("CRM", "READ"), getOfferHandler);
crmRoutes.get("/offers", requirePermission("CRM", "READ"), listOffersHandler);
crmRoutes.delete("/offers/:id", requirePermission("CRM", "DELETE"), deleteOfferHandler);

crmRoutes.post("/notifications", requirePermission("CRM", "CREATE"), createNotificationHandler);
crmRoutes.get("/notifications", requirePermission("CRM", "READ"), listNotificationsHandler);
crmRoutes.patch("/notifications/:id/read", requirePermission("CRM", "UPDATE"), markNotificationReadHandler);

crmRoutes.get("/profiles", requirePermission("CRM", "READ"), listProfilesHandler);

export default crmRoutes;
