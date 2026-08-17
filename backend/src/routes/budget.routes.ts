// backend/src/routes/budget.routes.ts

import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { BudgetController } from '../controllers/budget.controller.js';

const budgetRoutes = new Hono();

budgetRoutes.use('*', isAuthenticated);

budgetRoutes.get(
  '/',
  requirePermission('FINANCE', 'BUDGET:READ'),
  BudgetController.getBudgets
);

budgetRoutes.get(
  '/:id',
  requirePermission('FINANCE', 'BUDGET:READ'),
  BudgetController.getBudgetById
);

budgetRoutes.post(
  '/',
  requirePermission('FINANCE', 'BUDGET:CREATE'),
  BudgetController.createBudget
);

budgetRoutes.put(
  '/:id',
  requirePermission('FINANCE', 'BUDGET:UPDATE'),
  BudgetController.updateBudget
);

budgetRoutes.delete(
  '/:id',
  requirePermission('FINANCE', 'BUDGET:DELETE'),
  BudgetController.deleteBudget
);

budgetRoutes.get(
  '/summary/:year',
  requirePermission('FINANCE', 'BUDGET:READ'),
  BudgetController.getBudgetSummary
);

export default budgetRoutes;