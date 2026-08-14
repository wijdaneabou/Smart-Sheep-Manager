import { Hono } from "hono";
import {
  createIndividualWeightHandler,
  updateIndividualWeightHandler,
  listIndividualWeightsHandler,
  deleteIndividualWeightHandler,
} from "../controllers/fatteningBatchIndividualWeights.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const fatteningBatchIndividualWeightsRoutes = new Hono();

fatteningBatchIndividualWeightsRoutes.use("*", isAuthenticated);

fatteningBatchIndividualWeightsRoutes.post(
  "/",
  requirePermission("FATTENING", "UPDATE"),
  createIndividualWeightHandler
);
fatteningBatchIndividualWeightsRoutes.put(
  "/:id",
  requirePermission("FATTENING", "UPDATE"),
  updateIndividualWeightHandler
);
fatteningBatchIndividualWeightsRoutes.get(
  "/",
  requirePermission("FATTENING", "READ"),
  listIndividualWeightsHandler
);
fatteningBatchIndividualWeightsRoutes.delete(
  "/:id",
  requirePermission("FATTENING", "DELETE"),
  deleteIndividualWeightHandler
);

export default fatteningBatchIndividualWeightsRoutes;
