import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import api from "./api";

export async function logout() {
  try {
    const refreshToken = await SecureStore.getItemAsync("refreshToken");

    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } catch (error) {
    console.log("Erreur logout serveur :", error);
  } finally {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    router.replace("/(auth)/login"); // ⚠️ à corriger si le chemin réel diffère
  }
}