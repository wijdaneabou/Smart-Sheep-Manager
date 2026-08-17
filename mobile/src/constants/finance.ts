// mobile/src/constants/finance.ts

// ─── Existing: Budget, Expense, Revenue ──────────────────────

export const BUDGET_CATEGORIES = [
  'ALIMENTATION',
  'SANTE',
  'MAIN_DOEUVRE',
  'EQUIPMENT',
  'REPRODUCTION',
  'IOT',
  'DIVERS',
] as const;
export type BudgetCategory = typeof BUDGET_CATEGORIES[number];

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  ALIMENTATION: 'Alimentation',
  SANTE: 'Santé',
  MAIN_DOEUVRE: "Main d'œuvre",
  EQUIPMENT: 'Équipement',
  REPRODUCTION: 'Reproduction',
  IOT: 'IoT',
  DIVERS: 'Divers',
};

export const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  ALIMENTATION: '#16a34a',
  SANTE: '#dc2626',
  MAIN_DOEUVRE: '#2563eb',
  EQUIPMENT: '#f59e0b',
  REPRODUCTION: '#7c3aed',
  IOT: '#0891b2',
  DIVERS: '#6b7280',
};

export const EXPENSE_CATEGORIES = BUDGET_CATEGORIES;
export type ExpenseCategory = BudgetCategory;

export const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'CHECK',
  'CARD',
  'OTHER',
] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement bancaire',
  CHECK: 'Chèque',
  CARD: 'Carte bancaire',
  OTHER: 'Autre',
};

// ─── Revenue ──────────────────────────────────────────────────

export const REVENUE_TYPES = [
  'LAMB_SALE',
  'WOOL_SALE',
  'BY_PRODUCT',
  'OTHER',
] as const;
export type RevenueType = typeof REVENUE_TYPES[number];

export const REVENUE_TYPE_LABELS: Record<RevenueType, string> = {
  LAMB_SALE: "Vente d'agneaux",
  WOOL_SALE: 'Vente de laine',
  BY_PRODUCT: 'Sous-produits',
  OTHER: 'Autre',
};

export const REVENUE_TYPE_COLORS: Record<RevenueType, string> = {
  LAMB_SALE: '#16a34a',
  WOOL_SALE: '#7c3aed',
  BY_PRODUCT: '#f59e0b',
  OTHER: '#6b7280',
};

export const REVENUE_STATUSES = ['COLLECTED', 'PENDING'] as const;
export type RevenueStatus = typeof REVENUE_STATUSES[number];

export const REVENUE_STATUS_LABELS: Record<RevenueStatus, string> = {
  COLLECTED: 'Encaissé',
  PENDING: 'En attente',
};

export const REVENUE_STATUS_COLORS: Record<RevenueStatus, string> = {
  COLLECTED: '#16a34a',
  PENDING: '#f59e0b',
};

// ─── Cashflow ──────────────────────────────────────────────────

export const CASHFLOW_COLORS = {
  INFLOW: '#16a34a',
  OUTFLOW: '#dc2626',
  BALANCE: '#2563eb',
  PROJECTION: '#f59e0b',
};