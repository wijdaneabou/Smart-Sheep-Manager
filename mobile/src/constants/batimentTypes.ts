export const BATIMENT_TYPES = [
  { id: "BERGERIE" as const, label: "Bergerie", icon: "🏚️", color: "#7c3aed", bg: "#f3e8ff" },
  { id: "STABULATION" as const, label: "Stabulation", icon: "🏠", color: "#2563eb", bg: "#eef2ff" },
  { id: "BOX" as const, label: "Box", icon: "📦", color: "#d97706", bg: "#fef3c7" },
  { id: "PARC" as const, label: "Parc", icon: "🔲", color: "#059669", bg: "#d1fae5" },
  { id: "PARCELLE" as const, label: "Parcelle", icon: "🌾", color: "#65a30d", bg: "#ecfccb" },
];

export function getBatimentTypeInfo(type: string) {
  return (
    BATIMENT_TYPES.find((t) => t.id === type) ?? {
      id: type,
      label: type,
      icon: "🏗️",
      color: "#666",
      bg: "#f0f0f0",
    }
  );
}

export const BATIMENT_ETATS = [
  { id: "BON" as const, label: "Bon", color: "#166534", bg: "#dcfce7" },
  { id: "MOYEN" as const, label: "Moyen", color: "#92400e", bg: "#fef3c7" },
  { id: "MAUVAIS" as const, label: "Mauvais", color: "#991b1b", bg: "#fee2e2" },
];

export function getBatimentEtatInfo(etat: string) {
  return (
    BATIMENT_ETATS.find((e) => e.id === etat) ?? {
      id: etat,
      label: etat,
      color: "#666",
      bg: "#f0f0f0",
    }
  );
}