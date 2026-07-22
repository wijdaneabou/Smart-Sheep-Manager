import axios from "axios";
import * as SecureStore from "expo-secure-store";

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

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;