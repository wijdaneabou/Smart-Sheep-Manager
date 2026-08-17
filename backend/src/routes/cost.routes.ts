// backend/src/routes/cost.routes.ts

import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { CostController } from '../controllers/cost.controller.js';

const costRoutes = new Hono();

costRoutes.use('*', isAuthenticated);

// GET /api/cost?startDate=...&endDate=...
costRoutes.get(
  '/',
  requirePermission('FINANCE', 'COST:READ'),
  CostController.getCostOfProduction
);

export default costRoutes;