// backend/src/routes/report.routes.ts

import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { ReportController } from '../controllers/report.controller.js';

const reportRoutes = new Hono();

reportRoutes.use('*', isAuthenticated);

// GET /api/reports/pnl?startDate=...&endDate=...
reportRoutes.get(
  '/pnl',
  requirePermission('FINANCE', 'REPORT:READ'),
  ReportController.getPnL
);

// GET /api/reports/pnl/export?startDate=...&endDate=...&format=csv|fec
reportRoutes.get(
  '/pnl/export',
  requirePermission('FINANCE', 'REPORT:READ'),
  ReportController.exportPnL
);

export default reportRoutes;