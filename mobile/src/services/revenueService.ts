// mobile/src/services/revenueService.ts

import api from './api';
import type { RevenueType, RevenueStatus, PaymentMethod } from '../constants/finance';

export interface Revenue {
  id: number;
  exploitationId: number;
  date: string;
  type: RevenueType;
  quantity: string | null;
  unitPrice: string | null;
  totalHT: string;
  totalTTC: string;
  buyer: string | null;
  paymentMethod: PaymentMethod;
  status: RevenueStatus;
  notes: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRevenueData {
  exploitationId: number;
  date?: string;
  type: RevenueType;
  quantity?: number | null;
  unitPrice?: number | null;
  totalHT: number;
  totalTTC: number;
  buyer?: string | null;
  paymentMethod?: PaymentMethod;
  status?: RevenueStatus;
  notes?: string | null;
}

export interface UpdateRevenueData extends Partial<CreateRevenueData> {}

export async function listRevenues(filters?: {
  startDate?: string;
  endDate?: string;
  type?: RevenueType;
}): Promise<{ success: boolean; data: Revenue[]; message?: string }> {
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.type) params.append('type', filters.type);
    const url = `/revenues${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(url);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Erreur lors du chargement des revenus',
    };
  }
}

export async function getRevenueById(id: number): Promise<{ success: boolean; data?: Revenue; message?: string }> {
  try {
    const response = await api.get(`/revenues/${id}`);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors du chargement du revenu',
    };
  }
}

export async function createRevenue(data: CreateRevenueData): Promise<{ success: boolean; data?: Revenue; message?: string }> {
  try {
    const response = await api.post('/revenues', data);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la création du revenu',
    };
  }
}

export async function updateRevenue(id: number, data: UpdateRevenueData): Promise<{ success: boolean; data?: Revenue; message?: string }> {
  try {
    const response = await api.put(`/revenues/${id}`, data);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la mise à jour du revenu',
    };
  }
}

export async function deleteRevenue(id: number): Promise<{ success: boolean; message?: string }> {
  try {
    await api.delete(`/revenues/${id}`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la suppression du revenu',
    };
  }
}