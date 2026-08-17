// backend/src/routes/expense.routes.ts

import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { ExpenseController } from '../controllers/expense.controller.js';

const expenseRoutes = new Hono();

expenseRoutes.use('*', isAuthenticated);

expenseRoutes.get(
  '/',
  requirePermission('FINANCE', 'EXPENSE:READ'),
  ExpenseController.getExpenses
);

expenseRoutes.get(
  '/:id',
  requirePermission('FINANCE', 'EXPENSE:READ'),
  ExpenseController.getExpenseById
);

expenseRoutes.post(
  '/',
  requirePermission('FINANCE', 'EXPENSE:CREATE'),
  ExpenseController.createExpense
);

expenseRoutes.put(
  '/:id',
  requirePermission('FINANCE', 'EXPENSE:UPDATE'),
  ExpenseController.updateExpense
);

expenseRoutes.delete(
  '/:id',
  requirePermission('FINANCE', 'EXPENSE:DELETE'),
  ExpenseController.deleteExpense
);

export default expenseRoutes;