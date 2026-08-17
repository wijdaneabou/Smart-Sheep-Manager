// mobile/src/services/profitabilityService.ts

import api from './api';

export interface ProfitabilitySummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalCosts: number;
  totalRevenues: number;
  grossMargin: number;
  netMargin: number;
  costsByCategory: Record<string, number>;
  revenuesByType: Record<string, number>;
}

export interface AnimalProfitability {
  animalId: number;
  animalName: string;
  rfid: string;
  totalCost: number;
  totalRevenue: number;
  margin: number;
}

/**
 * Get overall profitability summary for a given period.
 */
export async function getProfitabilitySummary(
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: ProfitabilitySummary; message?: string }> {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    const response = await api.get(`/profitability/summary?${params.toString()}`);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors du chargement de la rentabilité',
    };
  }
}

/**
 * Get profitability per animal (placeholder – will be extended later).
 */
export async function getAnimalProfitability(
  startDate: string,
  endDate: string,
  animalId?: number
): Promise<{ success: boolean; data?: AnimalProfitability[]; message?: string }> {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (animalId) params.append('animalId', String(animalId));
    const response = await api.get(`/profitability/animals?${params.toString()}`);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors du chargement de la rentabilité par animal',
    };
  }
}