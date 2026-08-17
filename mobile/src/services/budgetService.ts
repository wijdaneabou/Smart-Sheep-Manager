// mobile/src/services/budgetService.ts

import api from './api';
import { BUDGET_CATEGORIES, type BudgetCategory } from '../constants/finance';

export interface Budget {
  id: number;
  exploitationId: number;
  year: number;
  month: number | null;
  category: BudgetCategory;
  plannedAmount: string;
  actualAmount: string;
  notes: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetData {
  exploitationId: number;
  year: number;
  month?: number | null;
  category: BudgetCategory;
  plannedAmount: number;
  notes?: string | null;
}

export interface UpdateBudgetData extends Partial<CreateBudgetData> {}

export interface BudgetSummary {
  category: BudgetCategory;
  planned: number;
  actual: number;
  variance: number;
}

/**
 * Get list of budgets with optional filters
 */
export async function listBudgets(filters?: {
  year?: number;
  month?: number;
  category?: BudgetCategory;
}): Promise<{ success: boolean; data: Budget[]; message?: string }> {
  try {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', String(filters.year));
    if (filters?.month !== undefined) params.append('month', String(filters.month));
    if (filters?.category) params.append('category', filters.category);

    const url = `/budgets${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(url);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Erreur lors du chargement des budgets',
    };
  }
}

/**
 * Get a single budget by ID
 */
export async function getBudgetById(id: number): Promise<{ success: boolean; data?: Budget; message?: string }> {
  try {
    const response = await api.get(`/budgets/${id}`);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors du chargement du budget',
    };
  }
}

/**
 * Create a new budget
 */
export async function createBudget(data: CreateBudgetData): Promise<{ success: boolean; data?: Budget; message?: string }> {
  try {
    const response = await api.post('/budgets', data);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la création du budget',
    };
  }
}

/**
 * Update an existing budget
 */
export async function updateBudget(id: number, data: UpdateBudgetData): Promise<{ success: boolean; data?: Budget; message?: string }> {
  try {
    const response = await api.put(`/budgets/${id}`, data);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la mise à jour du budget',
    };
  }
}

/**
 * Delete a budget
 */
export async function deleteBudget(id: number): Promise<{ success: boolean; message?: string }> {
  try {
    await api.delete(`/budgets/${id}`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la suppression du budget',
    };
  }
}

/**
 * Get budget summary for a given year (planned vs actual by category)
 */
export async function getBudgetSummary(year: number): Promise<{ success: boolean; data?: BudgetSummary[]; message?: string }> {
  try {
    const response = await api.get(`/budgets/summary/${year}`);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors du chargement du résumé',
    };
  }
}