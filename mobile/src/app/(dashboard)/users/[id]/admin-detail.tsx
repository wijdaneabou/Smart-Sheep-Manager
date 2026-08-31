import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import {
  getUserAdminDetails,
  type UserAdminDetails,
  type UserExploitationSummary,
} from "../../../../services/userService";
import { getRoleName } from "../../../../constants/roles";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";

const TYPE_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  OVIN: { label: "Ovin", icon: "paw-outline" },
  CAPRIN: { label: "Caprin", icon: "paw-outline" },
  MIXTE: { label: "Mixte", icon: "layers-outline" },
};

export default function AdminUserDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const [data, setData] = useState<UserAdminDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDetails() {
    setError(null);
    const result = await getUserAdminDetails(userId);
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      fetchDetails().finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Vue Administratif</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Vue Administratid</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="#dc2626" style={{ marginBottom: 10 }} />
          <Text style={styles.errorText}>{error ?? "Données introuvables."}</Text>
          <Pressable style={styles.retryButton} onPress={fetchDetails}>
            <Text style={styles.retryButtonText}>RÉESSAYER</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = data.user.status === "ACTIVE";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={GREEN} />
        </Pressable>
        <Text style={styles.headerTitle}>Vue Administratif</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={data.exploitations}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeaderRow}>
                <Text style={styles.summaryTitle}>
                  {data.user.firstName} {data.user.lastName}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: isActive ? "#15803D" : "#DC2626" }]} />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: isActive ? "#15803D" : "#DC2626" },
                    ]}
                  >
                    {isActive ? "Actif" : "Inactif"}
                  </Text>
                </View>
              </View>

              <Text style={styles.summaryEmail}>{data.user.email}</Text>

              <View style={styles.roleBadge}>
                <Ionicons name="ribbon-outline" size={13} color={GREEN} />
                <Text style={styles.roleBadgeText}>{getRoleName(data.user.roleId)}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Ionicons name="business-outline" size={18} color={GREEN} />
                  <Text style={styles.statValue}>{data.totalExploitations}</Text>
                  <Text style={styles.statLabel}>Exploitations</Text>
                </View>
                <View style={styles.statBox}>
                  <Ionicons name="paw-outline" size={18} color={GREEN} />
                  <Text style={styles.statValue}>{data.totalAnimals}</Text>
                  <Text style={styles.statLabel}>Animaux</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Ionicons name="business-outline" size={16} color={GREEN} />
              <Text style={styles.sectionHeaderText}>Exploitations & animaux</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="business-outline" size={28} color="#B0B0B0" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>Aucune exploitation associée.</Text>
          </View>
        }
        renderItem={({ item }) => <ExploitationCard item={item} router={router} />}
      />
    </SafeAreaView>
  );
}

function ExploitationCard({
  item,
  router,
}: {
  item: UserExploitationSummary;
  router: ReturnType<typeof useRouter>;
}) {
  const typeInfo = TYPE_CONFIG[item.type] ?? { label: item.type, icon: "layers-outline" as const };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.typeBadge}>
          <Ionicons name={typeInfo.icon} size={12} color="#7C3AED" />
          <Text style={styles.typeBadgeText}>{typeInfo.label}</Text>
        </View>
      </View>

      <View style={styles.cardStatsRow}>
        <View style={styles.cardStatItem}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#666" />
          <Text style={styles.cardStatText}>{item.role}</Text>
        </View>
        <View style={styles.cardStatItem}>
          <Ionicons name="paw-outline" size={14} color="#666" />
          <Text style={styles.cardStatText}>
            {item.animalsCount} animal{item.animalsCount > 1 ? "s" : ""}
          </Text>
        </View>
        {item.superficie && (
          <View style={styles.cardStatItem}>
            <Ionicons name="resize-outline" size={14} color="#666" />
            <Text style={styles.cardStatText}>{item.superficie} ha</Text>
          </View>
        )}
      </View>

      <Pressable
        style={styles.cardAction}
        onPress={() => {
          router.push(`/exploitations/${item.id}/dashboard` as any);
        }}
      >
        <Text style={styles.cardActionText}>Voir l'exploitation</Text>
        <Feather name="arrow-right" size={14} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CREAM },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  errorText: { color: "#dc2626", fontSize: 14, textAlign: "center", marginBottom: 16 },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  container: { padding: 16, paddingBottom: 40 },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: { fontSize: 18, fontWeight: "800", color: "#111", flex: 1, marginRight: 10 },
  summaryEmail: { fontSize: 13, color: "#888", marginTop: 2, marginBottom: 12 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeActive: { backgroundColor: "#F0FDF4" },
  statusBadgeInactive: { backgroundColor: "#FEF2F2" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: GREEN },

  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#111", marginTop: 6 },
  statLabel: { fontSize: 11, color: "#666", fontWeight: "600", marginTop: 2 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#666" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#111", flex: 1, marginRight: 10 },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: { fontSize: 11, fontWeight: "700", color: "#7C3AED" },

  cardStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  cardStatItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardStatText: { fontSize: 12, color: "#555", fontWeight: "600" },

  cardAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 11,
  },
  cardActionText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});