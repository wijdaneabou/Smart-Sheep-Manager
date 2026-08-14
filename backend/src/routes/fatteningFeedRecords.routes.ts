import { Hono } from "hono";
import {
  createFeedRecordHandler,
  updateFeedRecordHandler,
  listFeedRecordsHandler,
  deleteFeedRecordHandler,
} from "../controllers/fatteningFeedRecords.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const fatteningFeedRecordsRoutes = new Hono();

fatteningFeedRecordsRoutes.use("*", isAuthenticated);

fatteningFeedRecordsRoutes.post("/", requirePermission("FATTENING", "UPDATE"), createFeedRecordHandler);
fatteningFeedRecordsRoutes.put("/:id", requirePermission("FATTENING", "UPDATE"), updateFeedRecordHandler);
fatteningFeedRecordsRoutes.get("/", requirePermission("FATTENING", "READ"), listFeedRecordsHandler);
fatteningFeedRecordsRoutes.delete("/:id", requirePermission("FATTENING", "DELETE"), deleteFeedRecordHandler);

export default fatteningFeedRecordsRoutes;
