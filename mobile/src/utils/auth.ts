import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

function canUseWebStorage() {
  return Platform.OS === "web" && typeof window !== "undefined" && !!window.localStorage;
}

export async function saveTokens(
  accessToken: string,
  refreshToken: string
) {
  if (canUseWebStorage()) {
    window.localStorage.setItem("accessToken", accessToken);
    window.localStorage.setItem("refreshToken", refreshToken);
    return;
  }

  await SecureStore.setItemAsync(
    "accessToken",
    accessToken
  );

  await SecureStore.setItemAsync(
    "refreshToken",
    refreshToken
  );
}

export async function getAccessToken() {
  if (canUseWebStorage()) {
    return window.localStorage.getItem("accessToken");
  }

  return await SecureStore.getItemAsync(
    "accessToken"
  );
}

export async function getRefreshToken() {
  if (canUseWebStorage()) {
    return window.localStorage.getItem("refreshToken");
  }

  return await SecureStore.getItemAsync(
    "refreshToken"
  );
}

export async function removeTokens() {
  if (canUseWebStorage()) {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
    return;
  }

  await SecureStore.deleteItemAsync(
    "accessToken"
  );

  await SecureStore.deleteItemAsync(
    "refreshToken"
  );
}
