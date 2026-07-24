// All 16 SSM modules with metadata, priority, and icon mappings

export type ModuleKey =
  | "users"
  | "permissions"
  | "exploitations"
  | "herd"
  | "iot"
  | "health"
  | "reproduction"
  | "feeding"
  | "fattening"
  | "ai"
  | "finance"
  | "commercial"
  | "bi"
  | "communication"
  | "reporting"
  | "ai-assistant";

export type ModuleId =
  | "USERS"
  | "ADMIN"
  | "EXPLOITATIONS"
  | "HERD"
  | "IOT"
  | "HEALTH"
  | "REPRODUCTION"
  | "FEEDING"
  | "FATTENING"
  | "AI"
  | "FINANCE"
  | "COMMERCIAL"
  | "BI_DASHBOARD"
  | "COMMUNICATION"
  | "REPORTING"
  | "AI_ASSISTANT";

export interface SSMModule {
  key: ModuleKey;
  module: ModuleId;
  icon: string;
  ionicon: string;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  route: string;
  available: boolean;
  adminOnly?: boolean;
  priority: number;
  tabLabel?: string;
}

export const MODULES: SSMModule[] = [
  {
    key: "exploitations",
    module: "EXPLOITATIONS",
    icon: "🏞️",
    ionicon: "business-outline",
    title: "Exploitations",
    subtitle: "Sites, parcelles, affectations",
    color: "#0EA5E9",
    bgColor: "#E0F2FE",
    route: "/exploitations",
    available: false,
    priority: 1,
    tabLabel: "Exploit",
  },
  {
    key: "herd",
    module: "HERD",
    icon: "🐑",
    ionicon: "paw-outline",
    title: "Gestion du troupeau",
    subtitle: "Fiches animales, pesées, pedigree",
    color: "#7C3AED",
    bgColor: "#F3E8FF",
    route: "/herd",
    available: false,
    priority: 2,
    tabLabel: "Troupeau",
  },
  {
    key: "health",
    module: "HEALTH",
    icon: "🩺",
    ionicon: "medical-outline",
    title: "Gestion sanitaire",
    subtitle: "Vaccinations, traitements, carnet",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    route: "/health",
    available: false,
    priority: 3,
    tabLabel: "Santé",
  },
  {
    key: "reproduction",
    module: "REPRODUCTION",
    icon: "🔁",
    ionicon: "git-compare-outline",
    title: "Reproduction",
    subtitle: "Saillies, gestation, mise-bas",
    color: "#C2410C",
    bgColor: "#FFEDD5",
    route: "/reproduction",
    available: false,
    priority: 4,
    tabLabel: "Repro",
  },
  {
    key: "feeding",
    module: "FEEDING",
    icon: "🌾",
    ionicon: "nutrition-outline",
    title: "Alimentation",
    subtitle: "Rations, stocks, distribution",
    color: "#16A34A",
    bgColor: "#DCFCE7",
    route: "/feeding",
    available: false,
    priority: 5,
    tabLabel: "Alim",
  },
  {
    key: "communication",
    module: "COMMUNICATION",
    icon: "💬",
    ionicon: "chatbubbles-outline",
    title: "Communication",
    subtitle: "Messages, notifications, canaux",
    color: "#0284C7",
    bgColor: "#E0F2FE",
    route: "/communication",
    available: false,
    priority: 6,
    tabLabel: "Comm",
  },
  {
    key: "fattening",
    module: "FATTENING",
    icon: "📈",
    ionicon: "trending-up-outline",
    title: "Engraissement",
    subtitle: "Suivi des lots et performance",
    color: "#EA580C",
    bgColor: "#FFEDD5",
    route: "/fattening",
    available: false,
    priority: 7,
    tabLabel: "Engrais",
  },
  {
    key: "iot",
    module: "IOT",
    icon: "📡",
    ionicon: "wifi-outline",
    title: "IoT & Capteurs",
    subtitle: "Mesures, alertes, automatisation",
    color: "#0284C7",
    bgColor: "#E0F2FE",
    route: "/iot",
    available: false,
    priority: 8,
    tabLabel: "IoT",
  },
  {
    key: "finance",
    module: "FINANCE",
    icon: "💰",
    ionicon: "cash-outline",
    title: "Gestion financière",
    subtitle: "Budget, trésorerie, rentabilité",
    color: "#15803D",
    bgColor: "#DCFCE7",
    route: "/finance",
    available: false,
    priority: 9,
    tabLabel: "Finance",
  },
  {
    key: "commercial",
    module: "COMMERCIAL",
    icon: "🛒",
    ionicon: "cart-outline",
    title: "Commercialisation",
    subtitle: "Ventes, commandes, clients",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    route: "/commercial",
    available: false,
    priority: 10,
    tabLabel: "Ventes",
  },
  {
    key: "bi",
    module: "BI_DASHBOARD",
    icon: "📊",
    ionicon: "bar-chart-outline",
    title: "Tableau de bord BI",
    subtitle: "KPI, tendances, indicateurs",
    color: "#0F766E",
    bgColor: "#CCFBF1",
    route: "/bi",
    available: false,
    priority: 11,
    tabLabel: "BI",
  },
  {
    key: "reporting",
    module: "REPORTING",
    icon: "🧾",
    ionicon: "document-text-outline",
    title: "Rapports",
    subtitle: "Exports, synthèses, conformité",
    color: "#6D28D9",
    bgColor: "#EDE9FE",
    route: "/reporting",
    available: false,
    priority: 12,
    tabLabel: "Rapports",
  },
  {
    key: "ai",
    module: "AI",
    icon: "🤖",
    ionicon: "brain-outline",
    title: "Intelligence artificielle",
    subtitle: "Aide à la décision et alertes",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    route: "/ai",
    available: false,
    priority: 13,
    tabLabel: "IA",
  },
  {
    key: "ai-assistant",
    module: "AI_ASSISTANT",
    icon: "✨",
    ionicon: "sparkles-outline",
    title: "Assistant IA",
    subtitle: "Réponses rapides et assistance",
    color: "#DB2777",
    bgColor: "#FCE7F3",
    route: "/ai-assistant",
    available: false,
    priority: 14,
    tabLabel: "Coach",
  },
  {
    key: "users",
    module: "USERS",
    icon: "👥",
    ionicon: "people-outline",
    title: "Gestion des utilisateurs",
    subtitle: "Comptes, rôles, photos, historique",
    color: "#15803D",
    bgColor: "#DCFCE7",
    route: "/users",
    available: true,
    priority: 15,
    tabLabel: "Users",
  },
  {
    key: "permissions",
    module: "ADMIN",
    icon: "🔐",
    ionicon: "shield-checkmark-outline",
    title: "Permissions & Rôles",
    subtitle: "Gérer les droits par module",
    color: "#0F766E",
    bgColor: "#CCFBF1",
    route: "/permissions",
    available: true,
    adminOnly: true,
    priority: 16,
    tabLabel: "Admin",
  },
];

export const getModulesByPriority = () =>
  [...MODULES].sort((a, b) => a.priority - b.priority);

export const getModuleByRoute = (route: string) =>
  MODULES.find((mod) => mod.route === route);

export const getPermittedModules = (
  permissions: string[],
  isAdmin: boolean
): SSMModule[] => {
  const allModules = getModulesByPriority();

  if (isAdmin) {
    return allModules;
  }

  return allModules.filter((mod) => {
    if (mod.adminOnly) return false;
    return permissions.includes(`${mod.module}:READ`);
  });
};

export const getTabModules = (
  permissions: string[],
  isAdmin: boolean
): {
  tabModules: SSMModule[];
  moreModules: SSMModule[];
} => {
  const permitted = getPermittedModules(permissions, isAdmin);

  if (isAdmin) {
    const usersModule = permitted.find((mod) => mod.key === "users");
    const adminModule = permitted.find((mod) => mod.key === "permissions");
    const tabModules = [usersModule, adminModule].filter(Boolean) as SSMModule[];
    const tabKeys = new Set(tabModules.map((mod) => mod.key));
    const moreModules = permitted.filter((mod) => !tabKeys.has(mod.key));
    return { tabModules, moreModules };
  }

  const tabModules = permitted.slice(0, 2);
  const moreModules = permitted.slice(2);
  return { tabModules, moreModules };
};
