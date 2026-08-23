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

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://172.27.182.10:3000";

// Helper to build a full URL for uploaded files (avatars, etc.)
export const getFileUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  // If the path already starts with http, return it as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Otherwise, prepend the API base URL
  return `${API_URL}${path}`;
};

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Construit une chaîne lisible décrivant l'appareil (ex: "Android | 16 | samsung | SM-A165F | SSM | 57.0.2")
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

// Intercepteur de requête : injecte le token JWT et les métadonnées de l'appareil
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["X-Device-Info"] = getDeviceInfo();

  return config;
});

// Gestion de la file d'attente lors du rafraîchissement du token
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

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

// Intercepteur de réponse : intercepte les erreurs 401 et régénère le token de manière transparente
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

        // Régénération du token auprès de l'API backend
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const newAccessToken = response.data?.accessToken;
        if (!newAccessToken) {
          throw new Error("Nouveau token non reçu");
        }

        // Sauvegarde du nouveau token
        await saveAccessToken(newAccessToken);

        // Mise à jour des en-têtes Authorization
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        // Rejouer la requête initiale sans que l'utilisateur n'aperçoive le message d'erreur
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