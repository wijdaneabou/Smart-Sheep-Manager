import api from './api';

export interface ReproductionCycle {
  id: number;
  animalId: number;
  heatDate: string;
  matingType: 'natural' | 'ai';
  maleId: number | null;
  semenReference: string | null;
  pregnancyConfirmed: boolean;
  confirmationDate: string | null;
  notes: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateCyclePayload = {
  animalId: number;
  heatDate: string;
  matingType: 'natural' | 'ai';
  maleId?: number | null;
  semenReference?: string | null;
  notes?: string | null;
};

export const reproductionService = {
  // Récupérer tous les cycles d'un animal
  getCyclesByAnimal: (animalId: number) =>
    api.get<{ success: boolean; data: ReproductionCycle[] }>(
      `/reproduction-cycles/animal/${animalId}`
    ),

  // Créer un nouveau cycle
  createCycle: (data: CreateCyclePayload) =>
    api.post<{ success: boolean; data: ReproductionCycle }>(
      '/reproduction-cycles',
      data
    ),

  // Confirmer une gestation
  confirmPregnancy: (cycleId: number, confirmationDate: string) =>
    api.patch<{ success: boolean; data: ReproductionCycle }>(
      `/reproduction-cycles/${cycleId}/confirm`,
      { confirmationDate }
    ),

  // Supprimer un cycle
  deleteCycle: (cycleId: number) =>
    api.delete<{ success: boolean }>(`/reproduction-cycles/${cycleId}`),
};