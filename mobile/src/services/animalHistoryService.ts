import api from "./api";
import { File, Paths, EncodingType } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import type { HistoryCategory } from "../constants/history";

export type HistoryFilters = {
  category?: HistoryCategory;
  from?: string;
  to?: string;
};

export interface HistoryEvent {
  id: number;
  category: HistoryCategory;
  title: string;
  description: string | null;
  date: string;
  createdAt: string;
  healthCategory?: string;
  veterinarian?: string | null;
  medication?: string | null;
  dosage?: string | null;
  status?: string | null;
  eventType?: string;
  partnerId?: number | null;
  result?: string | null;
  weight?: string | null;
  bcs?: string | null;
}

function extractError(err: any): string {
  console.log("HISTORY API ERROR - status:", err?.response?.status);
  console.log("HISTORY API ERROR - data:", JSON.stringify(err?.response?.data, null, 2));
  console.log("HISTORY API ERROR - message:", err?.message);

  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

/**
 * Récupère l'historique complet d'un animal.
 */
export async function getAnimalHistory(
  animalId: number,
  filters: HistoryFilters = {}
) {
  try {
    const params: Record<string, string> = {};
    if (filters.category) params.category = filters.category;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    const response = await api.get<{ data: HistoryEvent[] }>(
      `/animals/${animalId}/history`,
      { params }
    );
    return { success: true as const, events: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Exporte l'historique d'un animal en PDF, le télécharge et le partage.
 */
export async function exportAnimalHistoryPdf(
  animalId: number,
  filters: HistoryFilters = {}
) {
  try {
    const params: Record<string, string> = {};
    if (filters.category) params.category = filters.category;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    const response = await api.get(`/animals/${animalId}/history/export/pdf`, {
      params,
      responseType: "blob",
    });

    const blob = response.data as Blob;
    const fileName = `historique_animal_${animalId}.pdf`;

    // Convert blob to base64
    const base64 = await blobToBase64(blob);

    // Write the PDF file using the new expo-file-system API
    const file = new File(Paths.document, fileName);
    file.create({ overwrite: true });
    file.write(base64, { encoding: EncodingType.Base64 });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Exporter l'historique",
        UTI: "com.adobe.pdf",
      });
    } else {
      Alert.alert("Succès", `PDF enregistré : ${fileName}`);
    }

    return { success: true as const, fileUri: file.uri };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Convertit un Blob en chaîne base64.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Le résultat est de la forme "data:application/pdf;base64,...."
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
