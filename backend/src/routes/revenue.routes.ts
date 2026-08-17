// backend/src/routes/revenue.routes.ts

import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { RevenueController } from '../controllers/revenue.controller.js';

const revenueRoutes = new Hono();

revenueRoutes.use('*', isAuthenticated);

revenueRoutes.get(
  '/',
  requirePermission('FINANCE', 'REVENUE:READ'),
  RevenueController.getRevenues
);

revenueRoutes.get(
  '/:id',
  requirePermission('FINANCE', 'REVENUE:READ'),
  RevenueController.getRevenueById
);

revenueRoutes.post(
  '/',
  requirePermission('FINANCE', 'REVENUE:CREATE'),
  RevenueController.createRevenue
);

revenueRoutes.put(
  '/:id',
  requirePermission('FINANCE', 'REVENUE:UPDATE'),
  RevenueController.updateRevenue
);

revenueRoutes.delete(
  '/:id',
  requirePermission('FINANCE', 'REVENUE:DELETE'),
  RevenueController.deleteRevenue
);

export default revenueRoutes;