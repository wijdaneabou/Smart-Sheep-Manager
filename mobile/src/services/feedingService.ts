import api from "./api";

export type FeedCategory = 'FOURRAGE' | 'CONCENTRE' | 'MINERAL' | 'VITAMINE' | 'COMPLEMENT' | 'AUTRE';
export type FeedUnit = 'KG' | 'L' | 'TONNE' | 'SAC' | 'UNIT';
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type TargetType = 'AGNELAUX' | 'AGNEAUX_SEVRAGE' | 'BREBILLONS' | 'BELIERS' | 'AGNELLES' | 'TOUS' | 'AUTRE';
export type RationStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type DistributionTargetType = 'ANIMAL' | 'BATCH' | 'BATIMENT' | 'LOT';
export type TimeOfDay = 'MORNING' | 'MIDDAY' | 'EVENING' | 'NIGHT' | 'ALL_DAY';
export type WeatherConditions = 'BON' | 'CHAUD' | 'FROID' | 'HUMIDE' | 'SEC';

export interface FeedItem {
  id: number;
  exploitationId?: number;
  name: string;
  category: FeedCategory;
  unit: FeedUnit;
  unitPrice: string;
  currentStock: string;
  minStockThreshold: string;
  supplier?: string;
  description?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedStock {
  id: number;
  feedItemId: number;
  movementType: MovementType;
  quantity: string;
  unitPriceAtTime?: string;
  movementDate: string;
  batchNumber?: string;
  expiryDate?: string;
  reference?: string;
  notes?: string;
  recordedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedRationItem {
  id: number;
  rationId: number;
  feedItemId: number;
  percentage: string;
  quantityKgPerTon?: string;
  feedItemName?: string;
  feedItemCategory?: FeedCategory;
  feedItemUnit?: FeedUnit;
  feedItemUnitPrice?: string;
}

export interface FeedRation {
  id: number;
  exploitationId?: number;
  name: string;
  code?: string;
  targetType: TargetType;
  targetWeightKg?: string;
  dailyRationPerAnimalKg?: string;
  costPerKg: string;
  description?: string;
  status: RationStatus;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  items?: FeedRationItem[];
}

export interface FeedDistribution {
  id: number;
  rationId?: number;
  targetType: DistributionTargetType;
  animalId?: number;
  batimentId?: number;
  batchName?: string;
  distributionDate: string;
  timeOfDay: TimeOfDay;
  quantityDistributedKg: string;
  numberOfAnimals?: number;
  refusedQuantityKg: string;
  weatherConditions?: WeatherConditions;
  notes?: string;
  distributedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingReport {
  summary: {
    totalFeedItems: number;
    lowStockCount: number;
    totalDistributions: number;
    totalDistributedKg: number;
    activeRations: number;
    totalStockValue: number;
  };
  lowStockItems: FeedItem[];
  recentDistributions: FeedDistribution[];
}

export interface FoodCostGroup {
  groupKey: string;
  label: string;
  totalCost: number;
  distributionCount: number;
  numberOfAnimals: number;
  dailyCostPerAnimal: number;
  weightGainKg: number;
  costPerKgGain: number | null;
}

export interface FoodCostSummary {
  period: { startDate: string; endDate: string };
  groupBy: string;
  daysInPeriod: number;
  totalGroups: number;
  totalCost: number;
  totalAnimals: number;
  averageDailyCostPerAnimal: number;
  totalWeightGainKg: number;
  averageCostPerKgGain: number | null;
}

export interface FoodCostData {
  summary: FoodCostSummary;
  groups: FoodCostGroup[];
}

const feedingService = {
  async getReport(): Promise<FeedingReport> {
    const response = await api.get("/feeding/report");
    return response.data.data;
  },

  async getFeedItems(exploitationId?: number): Promise<FeedItem[]> {
    const params = exploitationId ? { params: { exploitationId } } : {};
    const response = await api.get("/feeding/items", params);
    return response.data.data;
  },

  async getFeedItem(id: number): Promise<FeedItem> {
    const response = await api.get(`/feeding/items/${id}`);
    return response.data.data;
  },

  async createFeedItem(data: Partial<FeedItem>): Promise<FeedItem> {
    const response = await api.post("/feeding/items", data);
    return response.data.data;
  },

  async updateFeedItem(id: number, data: Partial<FeedItem>): Promise<FeedItem> {
    const response = await api.put(`/feeding/items/${id}`, data);
    return response.data.data;
  },

  async deleteFeedItem(id: number) {
    const response = await api.delete(`/feeding/items/${id}`);
    return response.data;
  },

  async getLowStockItems(exploitationId?: number): Promise<FeedItem[]> {
    const params = exploitationId ? { params: { exploitationId } } : {};
    const response = await api.get("/feeding/items/low-stock", params);
    return response.data.data;
  },

  async getFeedStocks(feedItemId: number): Promise<FeedStock[]> {
    const response = await api.get(`/feeding/stocks/item/${feedItemId}`);
    return response.data.data;
  },

  async createFeedStock(data: Partial<FeedStock>): Promise<FeedStock> {
    const response = await api.post("/feeding/stocks", data);
    return response.data.data;
  },

  async getFeedRations(exploitationId?: number): Promise<FeedRation[]> {
    const params = exploitationId ? { params: { exploitationId } } : {};
    const response = await api.get("/feeding/rations", params);
    return response.data.data;
  },

  async getFeedRation(id: number): Promise<FeedRation> {
    const response = await api.get(`/feeding/rations/${id}`);
    return response.data.data;
  },

  async createFeedRation(data: Partial<FeedRation>): Promise<FeedRation> {
    const response = await api.post("/feeding/rations", data);
    return response.data.data;
  },

  async updateFeedRation(id: number, data: Partial<FeedRation>): Promise<FeedRation> {
    const response = await api.put(`/feeding/rations/${id}`, data);
    return response.data.data;
  },

  async deleteFeedRation(id: number) {
    const response = await api.delete(`/feeding/rations/${id}`);
    return response.data;
  },

  async getFeedDistributions(filters?: {
    startDate?: string;
    endDate?: string;
    targetType?: DistributionTargetType;
    batimentId?: number;
    animalId?: number;
  }): Promise<FeedDistribution[]> {
    const params = filters ? { params: filters } : {};
    const response = await api.get("/feeding/distributions", params);
    return response.data.data;
  },

  async createFeedDistribution(data: Partial<FeedDistribution>): Promise<FeedDistribution> {
    const response = await api.post("/feeding/distributions", data);
    return response.data.data;
  },

  async getStockDashboard() {
    const response = await api.get("/feeding-stock/dashboard");
    return response.data.data;
  },

  async getStockByType(filters?: {
    exploitationId?: number;
    category?: string;
    unit?: string;
    includeEmpty?: boolean;
  }) {
    const params = filters ? { params: filters } : {};
    const response = await api.get("/feeding-stock/stock-by-type", params);
    return response.data.data;
  },

  async getCriticalStockAlerts(filters?: {
    exploitationId?: number;
    severity?: string;
    belowPercentage?: number;
  }) {
    const params = filters ? { params: filters } : {};
    const response = await api.get("/feeding-stock/critical-stock-alerts", params);
    return response.data.data;
  },

  async getExpiryAlerts(filters?: {
    daysWindow?: number;
    exploitationId?: number;
    onlyWithStock?: boolean;
  }) {
    const params = filters ? { params: filters } : {};
    const response = await api.get("/feeding-stock/expiry-alerts", params);
    return response.data.data;
  },

  async createPurchase(data: any) {
    const response = await api.post("/feeding-stock/purchases", data);
    return response.data.data;
  },

  async getPurchaseHistory(filters?: {
    feedItemId?: number;
    startDate?: string;
    endDate?: string;
    supplier?: string;
    minTotalCost?: string;
    maxTotalCost?: string;
  }) {
    const params = filters ? { params: filters } : {};
    const response = await api.get("/feeding-stock/purchase-history", params);
    return response.data.data;
  },

  async updateStockThreshold(data: {
    feedItemId: number;
    minStockThreshold: string;
    safetyStockDays?: number;
    reorderPoint?: string;
  }) {
    const response = await api.patch("/feeding-stock/thresholds", data);
    return response.data.data;
  },

  async getFCR(filters?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'ANIMAL' | 'BATCH' | 'BATIMENT' | 'GLOBAL';
    targetType?: string;
    batimentId?: number;
    animalId?: number;
  }) {
    const params = filters ? { params: filters } : {};
    const response = await api.get("/feeding-stock/fcr", params);
    return response.data.data;
  },

  async getFoodCostPerAnimal(filters?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'ANIMAL' | 'BATCH' | 'BATIMENT' | 'MONTH';
  }) {
    const params = filters ? { params: filters } : {};
    const response = await api.get("/feeding-stock/cost-per-animal", params);
    return response.data.data;
  },
};

export default feedingService;
