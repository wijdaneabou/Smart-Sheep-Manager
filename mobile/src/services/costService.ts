// mobile/src/services/costService.ts

import api from './api';

export interface CostOfProduction {
  period: { startDate: string; endDate: string };
  directCosts: { category: string; total: number }[];
  indirectCosts: { category: string; total: number }[];
  totalDirectCost: number;
  totalIndirectCost: number;
  totalCost: number;
  totalWeightGained: number;
  costPerKg: number;
  benchmark?: { averageCostPerKg: number; percentile: number };
}

export async function getCostOfProduction(startDate: string, endDate: string): Promise<{ success: boolean; data?: CostOfProduction; message?: string }> {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get(`/cost?${params.toString()}`);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Erreur lors du chargement du coût de production' };
  }
}