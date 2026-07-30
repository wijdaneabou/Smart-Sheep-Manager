import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

function canUseWebStorage() {
  return Platform.OS === "web" && typeof window !== "undefined" && !!window.localStorage;
}

export async function saveToken(key: string, value: string) {
  if (canUseWebStorage()) {
    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function saveAccessToken(accessToken: string) {
  await saveToken("accessToken", accessToken);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await saveToken("accessToken", accessToken);
  await saveToken("refreshToken", refreshToken);
}

export async function getAccessToken() {
  if (canUseWebStorage()) {
    return window.localStorage.getItem("accessToken");
  }

  return await SecureStore.getItemAsync("accessToken");
}

export async function getRefreshToken() {
  if (canUseWebStorage()) {
    return window.localStorage.getItem("refreshToken");
  }

  return await SecureStore.getItemAsync("refreshToken");
}

export async function removeTokens() {
  if (canUseWebStorage()) {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
    return;
  }

  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
}
