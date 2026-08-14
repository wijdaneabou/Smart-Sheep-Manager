import api from "./api";

export type FatteningStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type FatteningBatch = {
  id: number;
  name: string;
  startDate: string;
  animalCount: number;
  initialAverageWeight: string;
  targetWeight: string;
  targetDailyGmq: string;
  estimatedEndDate: string | null;
  status: FatteningStatus;
  exploitationId: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FatteningBatchWeightRecord = {
  id: number;
  fatteningBatchId: number;
  averageWeight: string;
  date: string;
  note: string | null;
  createdAt: string;
};

export type GmqStats = {
  history: {
    dataPoints: {
      id: number;
      date: string;
      dateStr: string;
      weight: number;
      note: string | null;
      dailyGmq: number | null;
    }[];
    averageDailyGmq: number | null;
    overallGmq: number | null;
    totalRecords: number;
    firstWeight: number | null;
    lastWeight: number | null;
  };
  daysElapsed: number;
  initialWeight: number;
  targetWeight: number;
  targetGmq: number;
  projectedFinalWeight: number | null;
};

export type FatteningAlert = {
  id: number;
  fatteningBatchId: number;
  exploitationId: number | null;
  type: "LOW_GMQ" | "WEIGHT_DEVIATION";
  severity: "WARNING" | "CRITICAL";
  message: string;
  value: string | null;
  threshold: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FatteningBatchIndividualWeight = {
  id: number;
  fatteningBatchId: number;
  animalId: number | null;
  weight: string;
  date: string;
  note: string | null;
  createdAt: string;
};

export type FatteningFeedRecord = {
  id: number;
  fatteningBatchId: number;
  date: string;
  feedType: string;
  quantityKg: string;
  unitPrice: string;
  totalCost: string;
  note: string | null;
  createdAt: string;
};

export type FatteningBatchCostRecord = {
  id: number;
  fatteningBatchId: number;
  category: string;
  description: string | null;
  amount: string;
  date: string;
  createdAt: string;
};

export type BatchPerformance = {
  batchId: number;
  batchName: string;
  startDate: string | null;
  animalCount: number;
  initialWeight: number;
  targetWeight: number;
  currentWeight: number | null;
  status: string | null;
  exploitationId: number | null;
  daysElapsed: number;
  gmq: number | null;
  averageDailyGmq: number | null;
  totalWeightGain: number | null;
  totalFeedKg: number;
  totalFeedCost: number;
  fcr: number | null;
  totalCost: number;
  costPerKgGain: number | null;
  weightStdDev: number | null;
  weightAvg: number | null;
  weightMin: number | null;
  weightMax: number | null;
  weightCount: number;
  cv: number | null;
  homogeneityRating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | null;
};

export type BatchPerformanceRankings = {
  bestGmq: number[];
  bestFcr: number[];
  bestCostPerKg: number[];
  bestHomogeneity: number[];
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

function extractError(err: any): string {
  const data = err?.response?.data;

  const fieldErrors = data?.error?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstField = Object.keys(fieldErrors)[0];
    const firstMessage = fieldErrors[firstField]?.[0];
    if (firstMessage) return `${firstField} : ${firstMessage}`;
  }

  const formErrors = data?.error?.formErrors;
  if (Array.isArray(formErrors) && formErrors.length > 0) {
    return formErrors[0];
  }

  const apiError = data?.error;
  if (typeof apiError === "string") return apiError;

  if (typeof data?.message === "string") return data.message;

  if (!err?.response) return "Impossible de contacter le serveur.";
  return `Erreur ${err.response.status} : la requête a été refusée.`;
}

export async function listFatteningBatches(
  params: { page?: number; limit?: number; search?: string; status?: string; exploitationId?: number } = {}
) {
  try {
    const response = await api.get<{
      data: FatteningBatch[];
      pagination: Pagination;
    }>("/fattening-batches", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getFatteningBatchById(id: number) {
  try {
    const response = await api.get<{ data: FatteningBatch }>(`/fattening-batches/${id}`);
    return { success: true as const, batch: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createFatteningBatch(input: {
  name: string;
  startDate: string;
  animalCount: number;
  initialAverageWeight: number;
  targetWeight: number;
  targetDailyGmq?: number | null;
  estimatedEndDate?: string | null;
  exploitationId?: number | null;
  notes?: string | null;
  status?: FatteningStatus;
}) {
  try {
    const response = await api.post<{ data: FatteningBatch }>(
      "/fattening-batches",
      input
    );
    return {
      success: true as const,
      batch: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function updateFatteningBatch(
  id: number,
  input: Partial<{
    name: string;
    startDate: string;
    animalCount: number;
    initialAverageWeight: number;
    targetWeight: number;
    targetDailyGmq: number;
    estimatedEndDate: string | null;
    status: FatteningStatus;
    exploitationId: number | null;
    notes: string | null;
  }>
) {
  try {
    const response = await api.put<{ data: FatteningBatch }>(
      `/fattening-batches/${id}`,
      input
    );
    return {
      success: true as const,
      batch: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function deleteFatteningBatch(id: number) {
  try {
    await api.delete(`/fattening-batches/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createBatchWeightRecord(input: {
  fatteningBatchId: number;
  averageWeight: number;
  date: string;
  note?: string | null;
}) {
  try {
    const response = await api.post<{ data: FatteningBatchWeightRecord }>(
      "/fattening-batches/weight-records",
      input
    );
    return {
      success: true as const,
      record: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function listBatchWeightRecords(batchId: number) {
  try {
    const response = await api.get<{ data: FatteningBatchWeightRecord[] }>(
      `/fattening-batches/weight-records/batch/${batchId}`
    );
    return { success: true as const, records: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getBatchGmqStats(batchId: number) {
  try {
    const response = await api.get<{ data: GmqStats }>(
      `/fattening-batches/weight-records/batch/${batchId}/gmq`
    );
    return { success: true as const, stats: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function deleteBatchWeightRecord(id: number) {
  try {
    await api.delete(`/fattening-batches/weight-records/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function listFatteningAlerts(params: {
  fatteningBatchId?: number;
  exploitationId?: number;
  resolved?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const response = await api.get<{ data: FatteningAlert[]; total: number }>(
      "/fattening-batches/alerts",
      { params }
    );
    return {
      success: true as const,
      alerts: response.data.data,
      total: response.data.total,
    };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function resolveFatteningAlert(id: number) {
  try {
    const response = await api.patch<{ data: FatteningAlert }>(
      `/fattening-batches/alerts/${id}/resolve`
    );
    return { success: true as const, alert: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function evaluateFatteningAlerts(batchId: number) {
  try {
    const response = await api.post<{ data: FatteningAlert[]; total: number }>(
      `/fattening-batches/alerts/batch/${batchId}/evaluate`
    );
    return {
      success: true as const,
      alerts: response.data.data,
      total: response.data.total,
    };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getFatteningAlertSummary(exploitationId: number) {
  try {
    const response = await api.get<{ data: Record<string, number> }>(
      "/fattening-batches/alerts/summary",
      { params: { exploitationId } }
    );
    return { success: true as const, summary: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function compareBatchPerformance(params: {
  exploitationId?: number;
  onlyCompleted?: boolean;
}) {
  try {
    const response = await api.get<{
      data: BatchPerformance[];
      rankings: BatchPerformanceRankings;
    }>("/fattening-batches/performance", { params });
    return {
      success: true as const,
      batches: response.data.data,
      rankings: response.data.rankings,
    };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createFeedRecord(input: {
  fatteningBatchId: number;
  date: string;
  feedType: string;
  quantityKg: number;
  unitPrice: number;
  note?: string | null;
}) {
  try {
    const response = await api.post<{ data: FatteningFeedRecord }>(
      "/fattening-batches/feed-records",
      input
    );
    return { success: true as const, record: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function listFeedRecords(batchId: number) {
  try {
    const response = await api.get<{ data: FatteningFeedRecord[] }>(
      "/fattening-batches/feed-records",
      { params: { batchId } }
    );
    return { success: true as const, records: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function deleteFeedRecord(id: number) {
  try {
    await api.delete(`/fattening-batches/feed-records/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createBatchCost(input: {
  fatteningBatchId: number;
  category: string;
  description?: string | null;
  amount: number;
  date: string;
}) {
  try {
    const response = await api.post<{ data: FatteningBatchCostRecord }>(
      "/fattening-batches/costs",
      input
    );
    return { success: true as const, record: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function listBatchCosts(batchId: number) {
  try {
    const response = await api.get<{ data: FatteningBatchCostRecord[] }>(
      "/fattening-batches/costs",
      { params: { batchId } }
    );
    return { success: true as const, costs: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function deleteBatchCost(id: number) {
  try {
    await api.delete(`/fattening-batches/costs/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createIndividualWeight(input: {
  fatteningBatchId: number;
  animalId?: number | null;
  weight: number;
  date: string;
  note?: string | null;
}) {
  try {
    const response = await api.post<{ data: FatteningBatchIndividualWeight }>(
      "/fattening-batches/individual-weights",
      input
    );
    return { success: true as const, record: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function listIndividualWeights(batchId: number) {
  try {
    const response = await api.get<{ data: FatteningBatchIndividualWeight[] }>(
      "/fattening-batches/individual-weights",
      { params: { batchId } }
    );
    return { success: true as const, records: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function deleteIndividualWeight(id: number) {
  try {
    await api.delete(`/fattening-batches/individual-weights/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
