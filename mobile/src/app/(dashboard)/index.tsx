import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

type ModuleCard = {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  route: string;
  available: boolean;
};

// Module 1 (Utilisateurs) et debut du Module 2 (Exploitations) realises.
// Les autres apparaissent en apercu, desactives, pour montrer la roadmap
// (16 modules prevus au cahier des charges).
const MODULES: ModuleCard[] = [
  {
    key: "users",
    icon: "👥",
    title: "Gestion des utilisateurs",
    subtitle: "Comptes, rôles, photos, historique",
    color: "#2563eb",
    bgColor: "#eef2ff",
    route: "/users",
    available: true,
  },
  {
    key: "permissions",
    icon: "🔐",
    title: "Permissions & Rôles",
    subtitle: "Gérer les droits par module",
    color: "#7c3aed",
    bgColor: "#f3e8ff",
    route: "/permissions",
    available: true,
  },
  {
    key: "exploitations",
    icon: "🏡",
    title: "Exploitations",
    subtitle: "Fiches, GPS, superficie",
    color: "#059669",
    bgColor: "#d1fae5",
    route: "/exploitations",
    available: true,
  },
  {
    key: "herd",
    icon: "🐑",
    title: "Gestion du troupeau",
    subtitle: "Fiches animales, pesées, pedigree",
    color: "#7c3aed",
    bgColor: "#f3e8ff",
    route: "",
    available: false,
  },
  {
    key: "health",
    icon: "🩺",
    title: "Gestion sanitaire",
    subtitle: "Vaccinations, traitements, carnet",
    color: "#dc2626",
    bgColor: "#fee2e2",
    route: "",
    available: false,
  },
  {
    key: "finance",
    icon: "💰",
    title: "Gestion financière",
    subtitle: "Budget, trésorerie, rentabilité",
    color: "#16a34a",
    bgColor: "#dcfce7",
    route: "",
    available: false,
  },
];

export default function Dashboard() {
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
          </View>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>SSM</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Modules</Text>

        <View style={styles.cardsList}>
          {MODULES.map((mod) => (
            <Pressable
              key={mod.key}
              style={[styles.card, !mod.available && styles.cardDisabled]}
              disabled={!mod.available}
              onPress={() => mod.available && router.push(mod.route as any)}
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
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  greeting: { fontSize: 14, color: "#888" },
  appName: { fontSize: 21, fontWeight: "700", marginTop: 2 },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  cardsList: { gap: 10 },
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
  cardSubtitle: { fontSize: 12, color: "#888", marginTop: 2 },
  chevron: { fontSize: 26, fontWeight: "300", marginLeft: 8 },
  soonBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  soonBadgeText: { fontSize: 10, fontWeight: "600", color: "#999" },
});