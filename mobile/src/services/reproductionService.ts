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
  expectedLambingDate: string | null;
  ultrasoundNotes: string | null;
  lambingDate: string | null;
  lambingType: 'single' | 'multiple' | null;
  liveBorn: number | null;
  stillBorn: number | null;
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

export type UpdatePregnancyPayload = {
  expectedLambingDate?: string;
  ultrasoundNotes?: string;
  lambingDate?: string;
  lambingType?: 'single' | 'multiple';
  liveBorn?: number;
  stillBorn?: number;
};

export const reproductionService = {
  getCyclesByAnimal: (animalId: number) =>
    api.get<{ success: boolean; data: ReproductionCycle[] }>(
      `/reproduction-cycles/animal/${animalId}`
    ),

  getCycleById: (cycleId: number) =>
    api.get<{ success: boolean; data: ReproductionCycle }>(
      `/reproduction-cycles/${cycleId}`
    ),

  createCycle: (data: CreateCyclePayload) =>
    api.post<{ success: boolean; data: ReproductionCycle }>(
      '/reproduction-cycles',
      data
    ),

  confirmPregnancy: (cycleId: number, confirmationDate: string) =>
    api.patch<{ success: boolean; data: ReproductionCycle }>(
      `/reproduction-cycles/${cycleId}/confirm`,
      { confirmationDate }
    ),

  updatePregnancy: (cycleId: number, data: UpdatePregnancyPayload) =>
    api.patch<{ success: boolean; data: ReproductionCycle }>(
      `/reproduction-cycles/${cycleId}/pregnancy`,
      data
    ),

  // ✅ US‑6.4 : Enregistrement d'une mise bas
  recordLambing: (cycleId: number, data: {
    lambingDate: string;
    lambingType: 'single' | 'multiple';
    liveBorn: number;
    stillBorn: number;
    lambs?: { sex: 'MALE' | 'FEMALE'; weight?: number; name?: string; birthDate?: string }[];
  }) =>
    api.post<{ success: boolean; data: any }>(
      `/reproduction-cycles/${cycleId}/lambing`,
      data
    ),
  
    // ─── US‑6.5 : Performance reproductive ──────────────────────────

    getPerformance: (animalId: number) =>
      api.get<{ success: boolean; data: any }>(`/reproduction-cycles/performance/${animalId}`),
    
    getHerdPerformance: (exploitationId: number) =>
      api.get<{ success: boolean; data: any }>(`/reproduction-cycles/performance/herd/${exploitationId}`),



  deleteCycle: (cycleId: number) =>
    api.delete<{ success: boolean }>(`/reproduction-cycles/${cycleId}`),
};