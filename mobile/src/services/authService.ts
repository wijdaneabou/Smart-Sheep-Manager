import { router } from "expo-router";
import api from "./api";
import { getRefreshToken, removeTokens } from "@/utils/auth";

export async function logout() {
  try {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } catch (error) {
    console.log("Erreur logout serveur :", error);
  } finally {
    await removeTokens();
    router.replace("/(auth)/login");
  }
}