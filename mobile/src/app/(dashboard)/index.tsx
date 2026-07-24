import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { usePermissions } from "@/contexts/PermissionsContext";
import { getPermittedModules } from "@/constants/modules";

export default function DashboardScreen() {
  const { permissions, userRole, isAdmin } = usePermissions();

  const permittedModules = useMemo(
    () => getPermittedModules(permissions, isAdmin),
    [isAdmin, permissions]
  );

  const featuredModules = permittedModules.slice(0, 6);
  const adminCount = permittedModules.filter((mod) => mod.adminOnly).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroEyebrow}>Smart Sheep Manager</Text>
            <Text style={styles.heroTitle}>
              {isAdmin ? "Bienvenue administrateur" : "Bienvenue sur votre espace"}
            </Text>
            <Text style={styles.heroSubtitle}>
              {isAdmin
                ? "Vous pouvez gérer les rôles, les permissions et tous les modules."
                : `Rôle actif: ${userRole || "utilisateur"}. Seuls les modules autorisés sont affichés.`}
            </Text>
          </View>
          <View style={styles.avatarBadge}>
            <Ionicons name={isAdmin ? "shield-checkmark-outline" : "analytics-outline"} size={24} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatPill label="Modules visibles" value={String(permittedModules.length)} />
          <StatPill label="Admin" value={String(adminCount)} />
          <StatPill label="Permissions" value={String(permissions.length)} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Accès rapides</Text>
        <Pressable onPress={() => router.push("/(dashboard)/more")}>
          <Text style={styles.sectionAction}>Voir tout</Text>
        </Pressable>
      </View>

      <View style={styles.quickGrid}>
        {featuredModules.map((mod) => (
          <Pressable
            key={mod.route}
            style={({ pressed }) => [styles.quickCard, pressed && styles.quickCardPressed]}
            onPress={() => router.push(mod.route as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${mod.color}18` }]}>
              <Ionicons name={mod.ionicon as any} size={22} color={mod.color} />
            </View>
            <Text style={styles.quickTitle}>{mod.tabLabel ?? mod.title}</Text>
            <Text style={styles.quickSubtitle} numberOfLines={2}>{mod.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Modules disponibles</Text>
        <Text style={styles.sectionMeta}>{permittedModules.length} au total</Text>
      </View>

      <View style={styles.moduleList}>
        {permittedModules.map((mod) => (
          <Pressable
            key={mod.route}
            style={({ pressed }) => [styles.moduleCard, pressed && styles.moduleCardPressed]}
            onPress={() => router.push(mod.route as any)}
          >
            <View style={styles.moduleCardLeft}>
              <View style={[styles.moduleIcon, { backgroundColor: `${mod.color}18` }]}>
                <Ionicons name={mod.ionicon as any} size={20} color={mod.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moduleName}>{mod.title}</Text>
                <Text style={styles.moduleDescription}>{mod.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F7F4",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: "#1b2316",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#0f2a19",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  heroEyebrow: {
    color: "#86EFAC",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  avatarBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(134, 239, 172, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    flexWrap: "wrap",
  },
  statPill: {
    flex: 1,
    minWidth: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f2a1d",
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F766E",
  },
  sectionMeta: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#0f2a1d",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 3,
  },
  quickCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  quickSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 17,
  },
  moduleList: {
    gap: 10,
  },
  moduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  moduleCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  moduleCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  moduleIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  moduleDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 17,
  },
});
