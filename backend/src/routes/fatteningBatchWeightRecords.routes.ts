import { Hono } from "hono";
import {
  createWeightRecordHandler,
  listWeightRecordsHandler,
  getGmqStatsHandler,
  deleteWeightRecordHandler,
} from "../controllers/fatteningBatchWeightRecords.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const fatteningBatchWeightRecordsRoutes = new Hono();

fatteningBatchWeightRecordsRoutes.use("*", isAuthenticated);

fatteningBatchWeightRecordsRoutes.post(
  "/",
  requirePermission("FATTENING", "UPDATE"),
  createWeightRecordHandler
);

fatteningBatchWeightRecordsRoutes.get(
  "/batch/:batchId",
  requirePermission("FATTENING", "READ"),
  listWeightRecordsHandler
);

fatteningBatchWeightRecordsRoutes.get(
  "/batch/:batchId/gmq",
  requirePermission("FATTENING", "READ"),
  getGmqStatsHandler
);

fatteningBatchWeightRecordsRoutes.delete(
  "/:id",
  requirePermission("FATTENING", "DELETE"),
  deleteWeightRecordHandler
);

export default fatteningBatchWeightRecordsRoutes;
