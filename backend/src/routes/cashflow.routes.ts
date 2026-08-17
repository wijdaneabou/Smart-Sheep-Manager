// backend/src/routes/cashflow.routes.ts

import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { CashflowController } from '../controllers/cashflow.controller.js';

const cashflowRoutes = new Hono();

cashflowRoutes.use('*', isAuthenticated);

// GET /api/cashflow – full cashflow (actual + projection)
cashflowRoutes.get(
  '/',
  requirePermission('FINANCE', 'CASHFLOW:READ'),
  CashflowController.getCashflow
);

// GET /api/cashflow/summary – quick dashboard summary
cashflowRoutes.get(
  '/summary',
  requirePermission('FINANCE', 'CASHFLOW:READ'),
  CashflowController.getCashflowSummary
);

// GET /api/cashflow/projection – only projection
cashflowRoutes.get(
  '/projection',
  requirePermission('FINANCE', 'CASHFLOW:READ'),
  CashflowController.getCashflowProjection
);

export default cashflowRoutes;