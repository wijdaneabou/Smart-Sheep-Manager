import AsyncStorage from "@react-native-async-storage/async-storage";

export type BiAlertMetric = "mortality" | "fertility" | "gmq" | "netMargin";
export type BiAlertRuleType = "fixed" | "averageDeviation" | "trend";
export type BiAlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type BiAlertChannel = "inApp" | "email" | "sms";
export interface BiAlertRule { id: string; metric: BiAlertMetric; type: BiAlertRuleType; threshold: number; periodDays: number; severity: BiAlertSeverity; channels: BiAlertChannel[]; enabled: boolean; }
const KEY = "bi-alert-rules-v1";
export async function listBiAlertRules(): Promise<BiAlertRule[]> { const raw = await AsyncStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; }
export async function saveBiAlertRules(rules: BiAlertRule[]) { await AsyncStorage.setItem(KEY, JSON.stringify(rules)); }
