// mobile/src/stores/predictionStore.ts
import { create } from 'zustand';
import  api from '../services/api';

export interface DataCompleteness {
  hasWeightData: boolean;
  hasBcsData: boolean;
  hasIotData: boolean;
  hasVaccinationData: boolean;
  hasHealthData: boolean;
  hasReproductionData: boolean;
  hasMinimumData: boolean;
  missingCategories: string[];
}

export interface Prediction {
  animalId: number;
  prediction: number;
  probability: number;
  riskLevel: string;
  thresholdUsed: number;
  profileUsed: string;
  explanations: Record<string, number>;
  featureValues: Record<string, any>;
  createdAt: string;
  dataStatus?: DataCompleteness;
  animalName?: string | null;
  animalRfid?: string | null;
  animalPhoto?: string | null;
  animalWeight?: number | null;
  currentWeight?: number | null;
  currentBcs?: number | null;
  currentTemperature?: number | null;
  currentActivity?: string | null;
  lastMeasuredAt?: string | null;
}

export interface PredictionStatistics {
  totalPredictions: number;
  highRisk: number;
  moderateRisk: number;
  lowRisk: number;
  averageProbability: number;
  recentPredictions: Prediction[];
}

interface PredictionState {
  statistics: PredictionStatistics | null;
  riskyAnimals: Prediction[];
  allAnimals: Prediction[]; // ✅ new
  isLoading: boolean;
  error: string | null;
  fetchStatistics: () => Promise<void>;
  fetchRiskyAnimals: (minProbability: number, limit: number) => Promise<void>;
  fetchAllAnimals: (limit: number) => Promise<void>; // ✅ new
  getAnimalPrediction: (animalId: number) => Promise<Prediction | null>;
  fetchAnimalHistory: (animalId: number, limit: number) => Promise<Prediction[]>;
  clearError: () => void;
}

export const usePredictionStore = create<PredictionState>((set, get) => ({
  statistics: null,
  riskyAnimals: [],
  allAnimals: [],
  isLoading: false,
  error: null,

  fetchStatistics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/predictions/statistics');
      set({ statistics: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error('[PredictionStore] Failed to fetch statistics:', error);
      set({ error: error.message || 'Failed to fetch statistics', isLoading: false });
    }
  },

  fetchRiskyAnimals: async (minProbability = 0.4, limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/predictions/risky-animals', {
        params: { min_probability: minProbability, limit },
      });
      set({ riskyAnimals: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error('[PredictionStore] Failed to fetch risky animals:', error);
      set({ error: error.message || 'Failed to fetch risky animals', isLoading: false });
    }
  },

  // ✅ new
  fetchAllAnimals: async (limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/predictions/all-animals', {
        params: { limit },
      });
      set({ allAnimals: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error('[PredictionStore] Failed to fetch all animals:', error);
      set({ error: error.message || 'Failed to fetch all animals.', isLoading: false });
    }
  },

  getAnimalPrediction: async (animalId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/predictions/animal/${animalId}`, {
        params: { profile: 'high_recall' },
      });
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      console.error('[PredictionStore] Failed to fetch prediction:', error);
      set({ error: error.message || 'Failed to fetch prediction', isLoading: false });
      throw error;
    }
  },

  fetchAnimalHistory: async (animalId: number, limit: number = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/predictions/animal/${animalId}/history`, {
        params: { limit },
      });
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      console.error('[PredictionStore] Failed to fetch history:', error);
      set({ error: error.message || 'Failed to fetch history', isLoading: false });
      return [];
    }
  },

  clearError: () => set({ error: null }),
}));