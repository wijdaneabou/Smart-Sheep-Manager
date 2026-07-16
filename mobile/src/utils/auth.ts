import * as SecureStore from "expo-secure-store";

export async function saveTokens(
  accessToken: string,
  refreshToken: string
) {
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
  return await SecureStore.getItemAsync(
    "accessToken"
  );
}

export async function getRefreshToken() {
  return await SecureStore.getItemAsync(
    "refreshToken"
  );
}

export async function removeTokens() {
  await SecureStore.deleteItemAsync(
    "accessToken"
  );

  await SecureStore.deleteItemAsync(
    "refreshToken"
  );
}