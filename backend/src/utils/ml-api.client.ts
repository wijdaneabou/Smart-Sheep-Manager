// src/utils/ml-api.client.ts
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';

/**
 * Interface for the 32 features expected by the FastAPI ML service.
 */
export interface MlFeatureInput {
  breed: string;
  sex: string;
  age_days: number;
  has_bcs: number;
  bcs_last: number | null;
  bcs_mean_30d: number | null;
  bcs_count_30d: number | null;
  bcs_change_30d: number | null;
  days_since_last_bcs: number | null;
  has_iot: number;
  temp_mean_30d: number | null;
  temp_max_30d: number | null;
  temp_anomalies_30d: number | null;
  temp_last: number | null;
  rest_ratio_30d: number | null;
  movement_ratio_30d: number | null;
  grazing_ratio_30d: number | null;
  alert_count_30d: number | null;
  days_iot_data_30d: number | null;
  weight_last: number | null;
  weight_mean_30d: number | null;
  weight_change_30d: number | null;
  weight_count_30d: number | null;
  days_since_last_weight: number | null;
  vaccine_count: number;
  days_since_last_vaccine: number;
  repro_cycles_count: number;
  has_lambing: number;
  pregnancies_count: number;
  health_records_count_365d: number;
  days_since_last_disease_365d: number;
}

export interface MlPredictionResponse {
  prediction: number;
  probability: number;
  risk_level: string;
  threshold_used: number;
  profile_used: string;
  explanations: Record<string, number>;
  feature_values: Record<string, any>;
}

export interface MlBatchPredictionResponse {
  profile_used: string;
  threshold_used: number;
  count: number;
  results: Array<{
    prediction: number;
    probability: number;
    risk_level: string;
  }>;
}

/**
 * HTTP client for the FastAPI ML service.
 */
export class MlApiClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = process.env.ML_API_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.ML_API_TIMEOUT || '10000', 10);

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor with proper types
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        console.log(`[ML API] ➡️ ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: AxiosError) => {
        console.error('[ML API] Request error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor with proper types
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[ML API] ✅ ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        if (error.code === 'ECONNREFUSED') {
          console.error(
            `[ML API] ❌ Connection refused. Is the ML service running on ${this.baseUrl}?`
          );
        } else if (error.response) {
          console.error(
            `[ML API] ❌ ${error.response.status} - ${error.response.statusText}`
          );
          console.error('[ML API] Response data:', error.response.data);
        } else if (error.request) {
          console.error('[ML API] ❌ No response received from ML service');
        } else {
          console.error(`[ML API] ❌ Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Predict for a single animal.
   */
  async predictAnimal(
    features: MlFeatureInput,
    profile: string = 'high_recall'
  ): Promise<MlPredictionResponse> {
    try {
      const response = await this.client.post<MlPredictionResponse>(
        '/predict/animal',
        features,
        { params: { profile } }
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        throw new Error(
          `ML API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        );
      }
      throw new Error(
        `Failed to call ML API: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Predict for multiple animals.
   */
  async predictBatch(
    animals: MlFeatureInput[],
    profile: string = 'high_recall'
  ): Promise<MlBatchPredictionResponse> {
    try {
      const response = await this.client.post<MlBatchPredictionResponse>(
        '/predict/batch',
        { animals, profile }
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        throw new Error(
          `ML API batch error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        );
      }
      throw new Error(
        `Failed to call ML API batch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get risky animals (demo endpoint).
   */
  async getRiskyAnimals(
    limit: number = 10,
    minProbability: number = 0.4,
    profile: string = 'high_recall'
  ): Promise<{ message: string; demo: boolean; example: any[] }> {
    try {
      const response = await this.client.get('/predict/risky-animals', {
        params: { limit, min_probability: minProbability, profile },
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        throw new Error(
          `ML API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        );
      }
      throw new Error(
        `Failed to get risky animals: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Health check for the ML service.
   */
  async healthCheck(): Promise<{
    status: string;
    model_loaded: boolean;
    thresholds?: Record<string, number>;
  }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error: unknown) {
      console.error(
        '[ML API] Health check failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return { status: 'unhealthy', model_loaded: false };
    }
  }

  /**
   * Check if the ML service is available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy' && health.model_loaded === true;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance.
 */
export const mlApiClient = new MlApiClient();