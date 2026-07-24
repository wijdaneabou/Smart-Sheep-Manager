import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import { Platform } from "react-native";


const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.105:3000";


const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Web-compatible token getter
const getToken = async (): Promise<string | null> => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem("accessToken");
  }
  return await SecureStore.getItemAsync("accessToken");
};

// Web-compatible token saver
export const saveToken = async (key: string, value: string): Promise<void> => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

// Construit une chaîne lisible décrivant l'appareil (ex: "Android | 16 | samsung | SM-A165F | SSM | 57.0.2")
function getDeviceInfo(): string {
  const osLabel = Platform.OS === "android" ? "Android" : Platform.OS === "ios" ? "iOS" : "Web";

  const parts = [
    osLabel,
    Device.osVersion ?? undefined,
    Device.manufacturer ?? undefined,
    Device.modelName ?? undefined,
    "SSM",
    Platform.Version ? String(Platform.Version) : undefined,
  ];

  return parts.filter(Boolean).join(" | ");
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["X-Device-Info"] = getDeviceInfo();

  return config;
});

export default api;