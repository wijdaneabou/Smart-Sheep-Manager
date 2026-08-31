/**
 * backend/src/routes/biRoutes.ts
 * ------------------------------------------------------------------
 * Déclaration des endpoints REST du Module 12 (BI Dashboard).
 *
 * ⚠️ À ADAPTER :
 *   Les imports `authMiddleware` et `requirePermission` sont des
 *   placeholders. Remplace-les par TES middlewares réels (regarde
 *   comment `src/routes/animals.ts` ou un autre module les importe),
 *   par ex. :
 *     import { authenticate } from "../middlewares/authMiddleware";
 *     import { checkPermission } from "../middlewares/rbacMiddleware";
 *
 * Une fois prêt, enregistre ce routeur dans `src/app.ts` :
 *     import biRoutes from "./routes/biRoutes";
 *     app.route("/api/bi", biRoutes);
 * ------------------------------------------------------------------
 */

import { Hono } from "hono";
import * as biController from "../controllers/biController.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const biRoutes = new Hono();

biRoutes.use("*", isAuthenticated);

biRoutes.get("/dashboard", biController.getDashboard);
biRoutes.get("/financials", biController.getFinancials);
biRoutes.get("/fattening", biController.getFattening);
biRoutes.get("/benchmark", biController.getBenchmark);
biRoutes.get("/cooperative-overview", biController.getCooperativeOverview);
biRoutes.get("/alerts", biController.getAlerts);
biRoutes.get("/calendar-events", biController.getCalendarEvents);
biRoutes.get("/export/:format", biController.exportReport);

export default biRoutes;
