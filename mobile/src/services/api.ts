import axios from "axios";
import * as Device from "expo-device";
import { Platform } from "react-native";
import {
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
  saveToken,
  removeTokens,
} from "@/utils/auth";

export { saveToken };

// 🔥 Read API_URL from .env – NO FALLBACK!
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn(
    "⚠️ EXPO_PUBLIC_API_URL is not set in .env. Please set it to your backend URL."
  );
}

export const getFileUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_URL}${path}`;
};

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

function getDeviceInfo(): string {
  const osLabel =
    Platform.OS === "android" ? "Android" : Platform.OS === "ios" ? "iOS" : "Web";
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
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🔥 If data is FormData, remove Content-Type so axios sets the boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  config.headers["X-Device-Info"] = getDeviceInfo();
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await getRefreshToken();
        if (!storedRefreshToken) {
          throw new Error("Aucun refresh token disponible");
        }

        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const newAccessToken = response.data?.accessToken;
        if (!newAccessToken) {
          throw new Error("Nouveau token non reçu");
        }

        await saveAccessToken(newAccessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await removeTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;