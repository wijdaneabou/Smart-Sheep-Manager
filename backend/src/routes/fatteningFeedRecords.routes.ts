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

// 🔧 Changed from UPDATE to CREATE
fatteningFeedRecordsRoutes.post("/", requirePermission("FATTENING", "CREATE"), createFeedRecordHandler);
fatteningFeedRecordsRoutes.put("/:id", requirePermission("FATTENING", "UPDATE"), updateFeedRecordHandler);
fatteningFeedRecordsRoutes.get("/", requirePermission("FATTENING", "READ"), listFeedRecordsHandler);
fatteningFeedRecordsRoutes.delete("/:id", requirePermission("FATTENING", "DELETE"), deleteFeedRecordHandler);

export default fatteningFeedRecordsRoutes;