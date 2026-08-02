import api from './api';

export interface MatingService {
  id: number;
  animalId: number;
  cycleId: number | null;
  serviceDate: string;      // YYYY-MM-DD
  type: 'natural' | 'ai';
  maleId: number | null;
  semenReference: string | null;
  serviceNumber: number;
  result: 'success' | 'failure' | 'pending';
  notes: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateMatingPayload = {
  animalId: number;
  cycleId?: number | null;
  serviceDate: string;
  type: 'natural' | 'ai';
  maleId?: number | null;
  semenReference?: string | null;
  notes?: string | null;
};

export type UpdateMatingPayload = {
  serviceDate?: string;
  maleId?: number | null;
  semenReference?: string | null;
  result?: 'success' | 'failure' | 'pending';
  notes?: string | null;
};

export const matingService = {
  // Créer une saillie
  create: (data: CreateMatingPayload) =>
    api.post<{ success: boolean; data: MatingService }>('/mating-services', data),

  // Récupérer toutes les saillies d'une femelle
  getByAnimal: (animalId: number) =>
    api.get<{ success: boolean; data: MatingService[] }>(`/mating-services/animal/${animalId}`),

  // Récupérer les saillies d'un cycle
  getByCycle: (cycleId: number) =>
    api.get<{ success: boolean; data: MatingService[] }>(`/mating-services/cycle/${cycleId}`),

  // Mettre à jour une saillie
  update: (id: number, data: UpdateMatingPayload) =>
    api.patch<{ success: boolean; data: MatingService }>(`/mating-services/${id}`, data),

  // Supprimer une saillie
  delete: (id: number) =>
    api.delete<{ success: boolean }>(`/mating-services/${id}`),
};