// backend/src/routes/profitability.routes.ts

import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { ProfitabilityController } from '../controllers/profitability.controller.js';

const profitabilityRoutes = new Hono();

profitabilityRoutes.use('*', isAuthenticated);

// GET /api/profitability/summary?startDate=...&endDate=...
profitabilityRoutes.get(
  '/summary',
  requirePermission('FINANCE', 'PROFITABILITY:READ'),
  ProfitabilityController.getProfitabilitySummary
);

// GET /api/profitability/animals?startDate=...&endDate=...
profitabilityRoutes.get(
  '/animals',
  requirePermission('FINANCE', 'PROFITABILITY:READ'),
  ProfitabilityController.getAnimalProfitability
);

export default profitabilityRoutes;