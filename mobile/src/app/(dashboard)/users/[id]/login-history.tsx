import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getLoginHistory,
  type LoginHistoryEntry,
} from "../../../../services/userService";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";

export default function LoginHistoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  const [entries, setEntries] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadHistory() {
    setError(null);
    return getLoginHistory(userId).then((result) => {
      if (result.success) {
        setEntries(result.data);
      } else {
        setError(result.message);
      }
    });
  }

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      loadHistory().finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])
  );

  const successCount = entries.filter((e) => e.success).length;
  const failedCount = entries.length - successCount;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Historique des connexions</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={GREEN} />
        </Pressable>
        <Text style={styles.headerTitle}>Historique des connexions</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          !error && entries.length > 0 ? (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#15803D" />
                <Text style={styles.statValue}>{successCount}</Text>
                <Text style={styles.statLabel}>Réussies</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.statValue}>{failedCount}</Text>
                <Text style={styles.statLabel}>Échouées</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={32} color="#dc2626" style={{ marginBottom: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={loadHistory}>
                <Text style={styles.retryButtonText}>RÉESSAYER</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={32} color="#B0B0B0" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>Aucune connexion enregistrée.</Text>
            </View>
          )
        }
        renderItem={({ item }) => <LoginRow item={item} />}
      />
    </SafeAreaView>
  );
}

function LoginRow({ item }: { item: LoginHistoryEntry }) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: item.success ? "#F0FDF4" : "#FEF2F2" },
        ]}
      >
        <Ionicons
          name={item.success ? "checkmark" : "close"}
          size={16}
          color={item.success ? "#15803D" : "#DC2626"}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.date}>
          {new Date(item.loginAt).toLocaleString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <View style={styles.metaRow}>
          <Text
            style={[
              styles.metaBadge,
              { color: item.success ? "#15803D" : "#DC2626" },
            ]}
          >
            {item.success ? "Connexion réussie" : "Tentative échouée"}
          </Text>
          {item.ip && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{item.ip}</Text>
            </>
          )}
        </View>
        {item.userAgent && (
          <Text style={styles.userAgent} numberOfLines={1}>
            {item.userAgent}
          </Text>
        )}
      </View>
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
  headerTitle: { fontSize: 16, fontWeight: "700", color: GREEN, flex: 1, marginRight: 32, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  container: { padding: 16, paddingBottom: 40 },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111", marginTop: 6 },
  statLabel: { fontSize: 11, color: "#666", fontWeight: "600", marginTop: 2 },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#666" },
  errorText: { fontSize: 14, fontWeight: "600", color: "#dc2626", textAlign: "center", marginBottom: 14 },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  date: { fontSize: 13, fontWeight: "700", color: "#111" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 3, flexWrap: "wrap" },
  metaBadge: { fontSize: 12, fontWeight: "700" },
  metaDot: { fontSize: 12, color: "#ccc", marginHorizontal: 5 },
  metaText: { fontSize: 12, color: "#888", fontWeight: "500" },
  userAgent: { fontSize: 11, color: "#B0B0B0", marginTop: 3 },
});