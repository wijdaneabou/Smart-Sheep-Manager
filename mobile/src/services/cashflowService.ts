// mobile/src/services/cashflowService.ts

import api from './api';

export interface MonthlyCashflow {
  month: string;
  inflows: number;
  outflows: number;
  balance: number;
  cumulative: number;
}

export interface CashflowProjection {
  month: string;
  projectedInflows: number;
  projectedOutflows: number;
  projectedBalance: number;
  cumulative: number;
}

export interface CashflowSummary {
  currentMonth: MonthlyCashflow;
  yearToDate: {
    inflows: number;
    outflows: number;
    balance: number;
  };
  alert: {
    type: 'warning' | 'danger';
    message: string;
  } | null;
}

export interface FullCashflowData {
  actual: MonthlyCashflow[];
  projection: CashflowProjection[];
}

/**
 * Get full cashflow data (actual + projection)
 */
export async function getCashflow(
  months?: number
): Promise<{ success: boolean; data?: FullCashflowData; message?: string }> {
  try {
    const params = new URLSearchParams();
    if (months) params.append('months', String(months));
    const url = `/cashflow${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(url);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors du chargement du cashflow',
    };
  }
}

/**
 * Get cashflow summary for dashboard
 */
export async function getCashflowSummary(): Promise<{
  success: boolean;
  data?: CashflowSummary;
  message?: string;
}> {
  try {
    const response = await api.get('/cashflow/summary');
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors du chargement du résumé',
    };
  }
}

/**
 * Get cashflow projection only
 */
export async function getCashflowProjection(
  months?: number
): Promise<{ success: boolean; data?: CashflowProjection[]; message?: string }> {
  try {
    const params = new URLSearchParams();
    if (months) params.append('months', String(months));
    const url = `/cashflow/projection${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(url);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors du chargement de la projection',
    };
  }
}