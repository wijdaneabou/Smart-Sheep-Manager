export type MovementType = "ENTRY" | "EXIT" | "DEATH" | "SALE" | "PURCHASE";

export interface MovementTypeInfo {
  id: MovementType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const MOVEMENT_TYPES: MovementTypeInfo[] = [
  {
    id: "ENTRY",
    label: "Entrée",
    icon: "📥",
    color: "#16a34a",
    bgColor: "#dcfce8",
  },
  {
    id: "EXIT",
    label: "Sortie",
    icon: "📤",
    color: "#2563eb",
    bgColor: "#dbeafe",
  },
  {
    id: "DEATH",
    label: "Décès",
    icon: "💀",
    color: "#dc2626",
    bgColor: "#fee2e2",
  },
  {
    id: "SALE",
    label: "Vente",
    icon: "💰",
    color: "#7c3aed",
    bgColor: "#ede9fe",
  },
  {
    id: "PURCHASE",
    label: "Achat",
    icon: "🛒",
    color: "#ea580c",
    bgColor: "#ffedd5",
  },
];

export function getMovementTypeInfo(type: MovementType): MovementTypeInfo {
  return (
    MOVEMENT_TYPES.find((m) => m.id === type) ?? {
      id: "ENTRY",
      label: type,
      icon: "📅",
      color: "#6b7280",
      bgColor: "#f3f4f6",
    }
  );
}
