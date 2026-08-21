// All 16 SSM modules with metadata, priority, and icon mappings

export type ModuleKey =
  | "users"
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
  | "reporting";

export type ModuleId =
  | "USERS"
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
  | "REPORTING";

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
  // SWAPPED: communication now priority 1, exploitations priority 2
  {
    key: "communication",
    module: "COMMUNICATION",
    icon: "💬",
    ionicon: "chatbubbles-outline",
    title: "Communication",
    subtitle: "Messages, notifications, canaux",
    color: "#1F7A4D",
    bgColor: "#E6F8ED",
    route: "/communication",
    available: true,
    priority: 1,
    tabLabel: "Comm",
  },
  {
    key: "exploitations",
    module: "EXPLOITATIONS",
    icon: "🏞️",
    ionicon: "business-outline",
    title: "Exploitations",
    subtitle: "Sites, parcelles, affectations",
    color: "#15803D",
    bgColor: "#E6F8ED",
    route: "/exploitations",
    available: true,
    priority: 14,
    tabLabel: "Exploit",
  },
  {
    key: "herd",
    module: "HERD",
    icon: "🐑",
    ionicon: "paw-outline",
    title: "Gestion du troupeau",
    subtitle: "Fiches animales, pesées, pedigree",
    color: "#166534",
    bgColor: "#F3E8FF",
    route: "/herd",
    available: true,
    priority: 2,
    tabLabel: "Troupeau",
  },
  {
    key: "health",
    module: "HEALTH",
    icon: "🩺",
    ionicon: "medical-outline",
    title: "Gestion sanitaire & BCS",
    subtitle: "Score corporel radar, traitements",
    color: "#166534",
    bgColor: "#E6F8ED",
    route: "/health",
    available: true,
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
    color: "#2F855A",
    bgColor: "#E6F8ED",
    route: "/reproduction",
    available: true,
    priority: 5,
    tabLabel: "Repro",
  },
  {
    key: "feeding",
    module: "FEEDING",
    icon: "🌾",
    ionicon: "nutrition-outline",
    title: "Alimentation",
    subtitle: "Rations, stocks, distribution",
    color: "#15803D",
    bgColor: "#E6F8ED",
    route: "/feeding",
    available: true,
    priority: 6,
    tabLabel: "Alim",
  },
  {
    key: "fattening",
    module: "FATTENING",
    icon: "📈",
    ionicon: "trending-up-outline",
    title: "Engraissement",
    subtitle: "Suivi des lots et performance",
    color: "#2F855A",
    bgColor: "#E6F8ED",
    route: "/fattening",
    available: true,
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
    color: "#1F7A4D",
    bgColor: "#E6F8ED",
    route: "/iot",
    available: true,
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
    bgColor: "#E6F8ED",
    route: "/finance",
    available: true,
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
    color: "#15803D",
    bgColor: "#E6F8ED",
    route: "/commercial",
    available: true,
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
    color: "#166534",
    bgColor: "#E6F8ED",
    route: "/bi",
    available: true,
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
    color: "#2F855A",
    bgColor: "#E6F8ED",
    route: "/reporting",
    available: true,
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
    color: "#166534",
    bgColor: "#E6F8ED",
    route: "/ai",
    available: true,
    priority: 13,
    tabLabel: "IA",
  },
  {
    key: "users",
    module: "USERS",
    icon: "👥",
    ionicon: "people-outline",
    title: "Gestion des utilisateurs",
    subtitle: "Comptes, rôles, photos, historique",
    color: "#15803D",
    bgColor: "#E6F8ED",
    route: "/users",
    available: true,
    priority: 15,
    tabLabel: "Users",
  },
];

export const getModulesByPriority = () =>
  [...MODULES].sort((a, b) => a.priority - b.priority);

export const getModuleByRoute = (route: string) =>
  MODULES.find((mod) => mod.route === route);

/**
 * Helper: Check if user has ANY permission for a module.
 * Since we use granular permissions like "IOT:SHIELDS:READ" instead of "IOT:READ",
 * this function checks if any permission in the list starts with the module prefix.
 */
function hasModuleAccess(permissions: string[], moduleId: ModuleId): boolean {
  return permissions.some((p) => p.startsWith(`${moduleId}:`));
}

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
    // Use helper to check ANY permission for this module
    return hasModuleAccess(permissions, mod.module);
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

  // For tab selection, we exclude adminOnly modules (they go to More)
  const tabCandidates = permitted.filter((mod) => !mod.adminOnly);

  // Take first 3 as tabs, rest as more
  const tabModules = tabCandidates.slice(0, 3);
  const moreModules = permitted.filter(
    (mod) => !tabModules.includes(mod)
  );

  return { tabModules, moreModules };
};