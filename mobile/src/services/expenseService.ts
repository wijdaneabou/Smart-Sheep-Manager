// mobile/src/services/expenseService.ts

import api from './api';
import type { ExpenseCategory, PaymentMethod } from '../constants/finance';

export interface Expense {
  id: number;
  exploitationId: number;
  date: string;
  amount: string;
  category: ExpenseCategory;
  beneficiary: string | null;
  paymentMethod: PaymentMethod;
  justification: string | null;
  notes: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  exploitationId: number;
  date?: string;
  amount: number;
  category: ExpenseCategory;
  beneficiary?: string | null;
  paymentMethod?: PaymentMethod;
  justification?: string | null;
  notes?: string | null;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

/**
 * Get list of expenses with optional filters
 */
export async function listExpenses(filters?: {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
}): Promise<{ success: boolean; data: Expense[]; message?: string }> {
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.category) params.append('category', filters.category);

    const url = `/expenses${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(url);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Erreur lors du chargement des dépenses',
    };
  }
}

/**
 * Get a single expense by ID
 */
export async function getExpenseById(id: number): Promise<{ success: boolean; data?: Expense; message?: string }> {
  try {
    const response = await api.get(`/expenses/${id}`);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors du chargement de la dépense',
    };
  }
}

/**
 * Create a new expense
 */
export async function createExpense(data: CreateExpenseData): Promise<{ success: boolean; data?: Expense; message?: string }> {
  try {
    const response = await api.post('/expenses', data);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la création de la dépense',
    };
  }
}

/**
 * Update an existing expense
 */
export async function updateExpense(id: number, data: UpdateExpenseData): Promise<{ success: boolean; data?: Expense; message?: string }> {
  try {
    const response = await api.put(`/expenses/${id}`, data);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la mise à jour de la dépense',
    };
  }
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: number): Promise<{ success: boolean; message?: string }> {
  try {
    await api.delete(`/expenses/${id}`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la suppression de la dépense',
    };
  }
}