export const SENSOR_TYPES = [
  { id: "LOCALIZATION" as const, label: "Localisation GPS", icon: "📍" },
  { id: "TEMPERATURE" as const, label: "Température", icon: "🌡️" },
  { id: "ACTIVITY" as const, label: "Activité", icon: "🏃" },
  { id: "FEEDING" as const, label: "Alimentation", icon: "🌾" },
  { id: "WATER_INTAKE" as const, label: "Consommation d'eau", icon: "💧" },
  { id: "HEART_RATE" as const, label: "Fréquence cardiaque", icon: "❤️" },
];

export function getSensorTypeInfo(sensorType: string) {
  return (
    SENSOR_TYPES.find((s) => s.id === sensorType) ?? {
      id: sensorType,
      label: sensorType,
      icon: "📡",
    }
  );
}

export const SHIELD_STATUSES = [
  { id: "ACTIVE" as const, label: "Actif", icon: "✅", color: "#16a34a" },
  { id: "INACTIVE" as const, label: "Inactif", icon: "⚪", color: "#6b7280" },
];

export function getShieldStatusInfo(status: string) {
  return (
    SHIELD_STATUSES.find((s) => s.id === status) ?? {
      id: status,
      label: status,
      icon: "❓",
      color: "#666",
    }
  );
}
