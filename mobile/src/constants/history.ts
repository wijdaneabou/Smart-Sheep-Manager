export type HistoryCategory = "health" | "treatment" | "reproduction" | "weight";

export interface HistoryCategoryInfo {
  id: HistoryCategory | "all";
  label: string;
  icon: string;
  color: string;
}

export const HISTORY_CATEGORIES: HistoryCategoryInfo[] = [
  { id: "all", label: "Tout", icon: "📅", color: "#6b7280" },
  { id: "health", label: "Santé", icon: "🩺", color: "#16a34a" },
  { id: "treatment", label: "Traitements", icon: "💊", color: "#2563eb" },
  { id: "reproduction", label: "Reproduction", icon: "🔁", color: "#7c3aed" },
  { id: "weight", label: "Poids", icon: "⚖️", color: "#ea580c" },
];

export function getCategoryInfo(category: string): HistoryCategoryInfo {
  return (
    HISTORY_CATEGORIES.find((c) => c.id === category) ?? {
      id: "all",
      label: category,
      icon: "📅",
      color: "#6b7280",
    }
  );
}
