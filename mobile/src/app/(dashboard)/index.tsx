import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { usePermissions } from "@/contexts/PermissionsContext";

type DashboardModule = {
  key: string;
  module: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  route: string;
  available: boolean;
  adminOnly?: boolean;
};

const MODULES: DashboardModule[] = [
  {
    key: "users",
    module: "USERS",
    icon: "👥",
    title: "Gestion des utilisateurs",
    subtitle: "Comptes, rôles, photos, historique",
    color: "#15803D",
    bgColor: "#DCFCE7",
    route: "/users",
    available: true,
  },
  {
    key: "permissions",
    module: "ADMIN",
    icon: "🔐",
    title: "Permissions & Rôles",
    subtitle: "Gérer les droits par module",
    color: "#0F766E",
    bgColor: "#CCFBF1",
    route: "/permissions",
    available: true,
    adminOnly: true,
  },
  {
    key: "exploitations",
    module: "EXPLOITATIONS",
    icon: "🏞️",
    title: "Exploitations",
    subtitle: "Sites, parcelles, affectations",
    color: "#0EA5E9",
    bgColor: "#E0F2FE",
    route: "",
    available: false,
  },
  {
    key: "herd",
    module: "HERD",
    icon: "🐑",
    title: "Gestion du troupeau",
    subtitle: "Fiches animales, pesées, pedigree",
    color: "#7C3AED",
    bgColor: "#F3E8FF",
    route: "",
    available: false,
  },
  {
    key: "iot",
    module: "IOT",
    icon: "📡",
    title: "IoT & Capteurs",
    subtitle: "Mesures, alertes, automatisation",
    color: "#0284C7",
    bgColor: "#E0F2FE",
    route: "",
    available: false,
  },
  {
    key: "health",
    module: "HEALTH",
    icon: "🩺",
    title: "Gestion sanitaire",
    subtitle: "Vaccinations, traitements, carnet",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    route: "",
    available: false,
  },
  {
    key: "reproduction",
    module: "REPRODUCTION",
    icon: "🔁",
    title: "Reproduction",
    subtitle: "Saillies, gestation, mise-bas",
    color: "#C2410C",
    bgColor: "#FFEDD5",
    route: "",
    available: false,
  },
  {
    key: "feeding",
    module: "FEEDING",
    icon: "🌾",
    title: "Alimentation",
    subtitle: "Rations, stocks, distribution",
    color: "#16A34A",
    bgColor: "#DCFCE7",
    route: "",
    available: false,
  },
  {
    key: "fattening",
    module: "FATTENING",
    icon: "📈",
    title: "Engraissement",
    subtitle: "Suivi des lots et performance",
    color: "#EA580C",
    bgColor: "#FFEDD5",
    route: "",
    available: false,
  },
  {
    key: "ai",
    module: "AI",
    icon: "🤖",
    title: "Intelligence artificielle",
    subtitle: "Aide à la décision et alertes",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    route: "",
    available: false,
  },
  {
    key: "finance",
    module: "FINANCE",
    icon: "💰",
    title: "Gestion financière",
    subtitle: "Budget, trésorerie, rentabilité",
    color: "#15803D",
    bgColor: "#DCFCE7",
    route: "",
    available: false,
  },
  {
    key: "commercial",
    module: "COMMERCIAL",
    icon: "🛒",
    title: "Commercialisation",
    subtitle: "Ventes, commandes, clients",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    route: "",
    available: false,
  },
  {
    key: "bi",
    module: "BI_DASHBOARD",
    icon: "📊",
    title: "Tableau de bord BI",
    subtitle: "KPI, tendances, indicateurs",
    color: "#0F766E",
    bgColor: "#CCFBF1",
    route: "",
    available: false,
  },
  {
    key: "communication",
    module: "COMMUNICATION",
    icon: "💬",
    title: "Communication",
    subtitle: "Messages, notifications, canaux",
    color: "#0284C7",
    bgColor: "#E0F2FE",
    route: "",
    available: false,
  },
  {
    key: "reporting",
    module: "REPORTING",
    icon: "🧾",
    title: "Rapports",
    subtitle: "Exports, synthèses, conformité",
    color: "#6D28D9",
    bgColor: "#EDE9FE",
    route: "",
    available: false,
  },
  {
    key: "ai-assistant",
    module: "AI_ASSISTANT",
    icon: "✨",
    title: "Assistant IA",
    subtitle: "Réponses rapides et assistance",
    color: "#DB2777",
    bgColor: "#FCE7F3",
    route: "",
    available: false,
  },
];

export default function Dashboard() {
  const { hasAnyPermission, isAdmin, userRole } = usePermissions();

  const visibleModules = MODULES.filter((mod) =>
    mod.adminOnly ? isAdmin : hasAnyPermission(mod.module)
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>Smart Sheep Manager</Text>
            <Text style={styles.greeting}>
              {userRole ? `Rôle: ${userRole}` : "Accès personnalisé selon vos permissions"}
            </Text>
          </View>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>SSM</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Modules accessibles</Text>

        <View style={styles.cardsList}>
          {visibleModules.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun module disponible</Text>
              <Text style={styles.emptySubtitle}>
                Votre rôle n'a pas encore de permission READ active.
              </Text>
            </View>
          ) : (
            visibleModules.map((mod) => (
              <Pressable
                key={mod.key}
                style={[styles.card, !mod.available && styles.cardDisabled]}
                disabled={!mod.available}
                onPress={() => mod.available && mod.route && router.push(mod.route as any)}
              >
                <View style={[styles.iconWrapper, { backgroundColor: mod.bgColor }]}> 
                  <Text style={styles.icon}>{mod.icon}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{mod.title}</Text>
                  <Text style={styles.cardSubtitle}>{mod.subtitle}</Text>
                </View>

                {mod.available ? (
                  <Text style={[styles.chevron, { color: mod.color }]}>›</Text>
                ) : (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonBadgeText}>Bientôt</Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  greeting: { fontSize: 13, color: "#64748b", marginTop: 2 },
  appName: { fontSize: 21, fontWeight: "700", marginTop: 2, color: "#0f172a" },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#15803D",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  cardsList: { gap: 10 },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  emptySubtitle: { fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 18 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardDisabled: { opacity: 0.55 },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  icon: { fontSize: 22 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  cardSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  chevron: { fontSize: 26, fontWeight: "300", marginLeft: 8 },
  soonBadge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  soonBadgeText: { fontSize: 10, fontWeight: "600", color: "#64748b" },
});
