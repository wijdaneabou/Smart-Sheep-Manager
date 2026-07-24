import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import api from "./api";

export type PermissionsSnapshot = {
  permissions: string[];
  userRole: string;
};

const CACHE_KEY = "permissionsSnapshot";

function canUseWebStorage() {
  return Platform.OS === "web" && typeof window !== "undefined" && !!window.localStorage;
}

async function readRawValue(): Promise<string | null> {
  if (canUseWebStorage()) {
    return window.localStorage.getItem(CACHE_KEY);
  }
  return SecureStore.getItemAsync(CACHE_KEY);
}

async function writeRawValue(value: string): Promise<void> {
  if (canUseWebStorage()) {
    window.localStorage.setItem(CACHE_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(CACHE_KEY, value);
}

async function deleteRawValue(): Promise<void> {
  if (canUseWebStorage()) {
    window.localStorage.removeItem(CACHE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(CACHE_KEY);
}

export async function loadPermissionsSnapshot(): Promise<PermissionsSnapshot | null> {
  const raw = await readRawValue();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PermissionsSnapshot>;
    return {
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
      userRole: typeof parsed.userRole === "string" ? parsed.userRole : "",
    };
  } catch {
    return null;
  }
}

export async function savePermissionsSnapshot(snapshot: PermissionsSnapshot): Promise<void> {
  await writeRawValue(JSON.stringify(snapshot));
}

export async function clearPermissionsSnapshot(): Promise<void> {
  await deleteRawValue();
}

export async function fetchPermissionsSnapshot(): Promise<PermissionsSnapshot> {
  const response = await api.get<{
    permissions: string[];
    roleName?: string | null;
  }>("/auth/me/permissions");

  return {
    permissions: Array.isArray(response.data.permissions)
      ? response.data.permissions
      : [],
    userRole: response.data.roleName ?? "",
  };
}

export async function fetchAndCachePermissions(): Promise<PermissionsSnapshot> {
  const snapshot = await fetchPermissionsSnapshot();
  await savePermissionsSnapshot(snapshot);
  return snapshot;
}
