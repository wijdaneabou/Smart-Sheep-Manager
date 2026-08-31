/**
 * backend/src/routes/widgets.routes.ts
 * ------------------------------------------------------------------
 * Routes pour la configuration des widgets du tableau de bord.
 * ------------------------------------------------------------------
 */

import { Hono } from "hono";
import * as widgetsController from "../controllers/widgets.controller.js";

const widgetsRoutes = new Hono();

widgetsRoutes.get("/dashboard-widgets", widgetsController.getWidgetConfig);
widgetsRoutes.put("/dashboard-widgets", widgetsController.upsertWidgetConfig);
widgetsRoutes.get("/dashboard-widgets/default", widgetsController.getDefaultWidgetConfig);
widgetsRoutes.get("/dashboard-profiles", widgetsController.listProfiles);
widgetsRoutes.post("/dashboard-profiles", widgetsController.createProfile);
widgetsRoutes.put("/dashboard-profiles/:id", widgetsController.updateProfile);
widgetsRoutes.delete("/dashboard-profiles/:id", widgetsController.deleteProfile);
widgetsRoutes.post("/dashboard-profiles/:id/default", widgetsController.setDefaultProfile);

export default widgetsRoutes;
