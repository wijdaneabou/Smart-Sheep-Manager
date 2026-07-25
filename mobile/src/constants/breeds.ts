export const BREEDS = [
  { id: "Sardi" as const, label: "Sardi", icon: "🐑" },
  { id: "Timahdite" as const, label: "Timahdite", icon: "🐏" },
  { id: "D'man" as const, label: "D'man", icon: "🐐" },
  { id: "Beni-Guil" as const, label: "Beni-Guil", icon: "🐑" },
];

export function getBreedInfo(breed: string) {
  return (
    BREEDS.find((b) => b.id === breed) ?? {
      id: breed,
      label: breed,
      icon: "🐑",
    }
  );
}

export const SEXES = [
  { id: "MALE" as const, label: "Mâle", icon: "♂️" },
  { id: "FEMALE" as const, label: "Femelle", icon: "♀️" },
];

export function getSexInfo(sex: string) {
  return (
    SEXES.find((s) => s.id === sex) ?? {
      id: sex,
      label: sex,
      icon: "❓",
    }
  );
}

export const HEALTH_STATUSES = [
  { id: "HEALTHY" as const, label: "En bonne santé", icon: "✅", color: "#16a34a" },
  { id: "SICK" as const, label: "Malade", icon: "🤒", color: "#dc2626" },
  { id: "RECOVERING" as const, label: "En rétablissement", icon: "🩹", color: "#f59e0b" },
  { id: "DECEASED" as const, label: "Décédé", icon: "💀", color: "#6b7280" },
  { id: "QUARANTINE" as const, label: "En quarantaine", icon: "🚨", color: "#dc2626" },
];

export function getHealthStatusInfo(status: string) {
  return (
    HEALTH_STATUSES.find((h) => h.id === status) ?? {
      id: status,
      label: status,
      icon: "❓",
      color: "#666",
    }
  );
}
