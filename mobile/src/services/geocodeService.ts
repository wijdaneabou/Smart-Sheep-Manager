import api from "./api";

export type GeocodeResult = { display_name: string; lat: string; lon: string };

function extractError(err: any): string {
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

/**
 * Recherche de lieu via le proxy backend (/api/geocode/search), qui relaie
 * vers Nominatim côté serveur. Évite d'appeler Nominatim directement depuis
 * le mobile, qui bloque les requêtes sans Referer identifiable (renvoie une
 * réponse texte non-JSON qui fait planter response.json()).
 */
export async function searchLocation(query: string) {
  try {
    const response = await api.get<{ data: GeocodeResult[] }>("/geocode/search", {
      params: { q: query },
    });
    return { success: true as const, data: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}