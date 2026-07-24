import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";
import api from "../../../services/api";

type AuditLog = {
  id: number;
  userId: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  module: string;
  action: string;
  description: string;
  result: string;
  ip: string;
  userAgent: string;
  createdAt: string;
};

const PAGE_LIMIT = 15;

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  AUTH: { bg: "#E0F2E9", text: "#0F766E" },
  USERS: { bg: "#D1FAE5", text: "#047857" },
  EXPLOITATION: { bg: "#DCFCE7", text: "#15803D" },
  VACCINATION: { bg: "#ECFDF5", text: "#059669" },
};

function moduleStyle(module: string) {
  return MODULE_COLORS[module] ?? { bg: "#F0FDF4", text: "#166534" };
}

export default function AuditScreen() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadLogs(targetPage: number, searchTerm: string = search) {
    try {
      const response = await api.get("/audit", {
        params: {
          page: targetPage,
          limit: PAGE_LIMIT,
          search: searchTerm || undefined,
        },
      });

      const data: AuditLog[] = response.data;
      setLogs(data);
      setHasNextPage(data.length === PAGE_LIMIT);
      setPage(targetPage);
    } catch (err: any) {
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPageLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadLogs(1);
    }, [])
  );

  function handleSearchChange(text: string) {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setLoading(true);
      loadLogs(1, text);
    }, 400);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadLogs(1);
  }

  function goToNextPage() {
    if (!hasNextPage || pageLoading) return;
    setPageLoading(true);
    loadLogs(page + 1);
  }

  function goToPreviousPage() {
    if (page <= 1 || pageLoading) return;
    setPageLoading(true);
    loadLogs(page - 1);
  }

  async function handleExport(type: "csv" | "pdf") {
    try {
      setExporting(type);

      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        Alert.alert("Erreur", "Token introuvable.");
        return;
      }

      const url = `${api.defaults.baseURL}/audit/export/${type}`;

      const download = await FileSystem.downloadAsync(
        url,
        `${FileSystem.documentDirectory}audit_${Date.now()}.${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(download.uri);
      } else {
        Alert.alert("Succès", "Le fichier a été enregistré.");
      }
    } catch (err: any) {
      console.log("Erreur export :", err.response?.data || err.message);
      Alert.alert("Erreur", err.message ?? "Impossible d'exporter.");
    } finally {
      setExporting(null);
    }
  }

  const failedCount = logs.filter((l) => l.result !== "SUCCESS").length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* En-tête blanc */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.header}>Journal d'audit</Text>
            <Text style={styles.subtitle}>
              {logs.length} événement{logs.length > 1 ? "s" : ""}
              {failedCount > 0 && (
                <Text style={styles.failedCount}> · {failedCount} échec{failedCount > 1 ? "s" : ""}</Text>
              )}
            </Text>
          </View>

          <View style={styles.exportRow}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => handleExport("csv")}
              disabled={exporting !== null}
              activeOpacity={0.8}
            >
              {exporting === "csv" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.exportButtonText}>CSV</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => handleExport("pdf")}
              disabled={exporting !== null}
              activeOpacity={0.8}
            >
              {exporting === "pdf" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.exportButtonText}>PDF</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher (nom, module, action, IP...)"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={handleSearchChange}
        />
      </View>

      {/* Liste */}
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌾</Text>
            <Text style={styles.emptyTitle}>
              {search ? "Aucun résultat" : "Aucune action enregistrée"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? "Essayez une autre recherche."
                : "Les actions des utilisateurs apparaîtront ici."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const mColor = moduleStyle(item.module);
          return (
            <View style={styles.card}>
              <View style={styles.cardAccent} />

              <View style={styles.cardContent}>
                {/* Haut : badges */}
                <View style={styles.topRow}>
                  <View style={[styles.moduleBadge, { backgroundColor: mColor.bg }]}>
                    <Text style={[styles.moduleBadgeText, { color: mColor.text }]}>
                      {item.module}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      item.result === "SUCCESS" ? styles.success : styles.failed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.result === "SUCCESS" ? styles.successText : styles.failedText,
                      ]}
                    >
                      {item.result === "SUCCESS" ? "✓" : "✕"} {item.result}
                    </Text>
                  </View>

                  <Text style={styles.time}>
                    {new Date(item.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                <Text style={styles.action}>{item.action}</Text>

                {/* Utilisateur */}
                <View style={styles.userRow}>
                  <LinearGradient
                    colors={["#16A34A", "#22C55E"]}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>
                      {item.firstName?.charAt(0) ?? "?"}
                      {item.lastName?.charAt(0) ?? ""}
                    </Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>
                      {item.firstName ? `${item.firstName} ${item.lastName}` : "Utilisateur supprimé"}
                    </Text>
                    {item.email && <Text style={styles.email}>{item.email}</Text>}
                  </View>
                </View>

                {!!item.description && (
                  <Text style={styles.description}>{item.description}</Text>
                )}

                <View style={styles.separator} />

                <View style={styles.footerRow}>
                  <Text style={styles.footer}>🌐 {item.ip}</Text>
                  <Text style={styles.footer}>
                    {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          logs.length > 0 ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  page <= 1 && styles.pageButtonDisabled,
                ]}
                onPress={goToPreviousPage}
                disabled={page <= 1 || pageLoading}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    page <= 1 && styles.pageButtonTextDisabled,
                  ]}
                >
                  ← Précédent
                </Text>
              </TouchableOpacity>

              <View style={styles.pageIndicator}>
                {pageLoading ? (
                  <ActivityIndicator size="small" color="#16A34A" />
                ) : (
                  <Text style={styles.pageIndicatorText}>Page {page}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  !hasNextPage && styles.pageButtonDisabled,
                ]}
                onPress={goToNextPage}
                disabled={!hasNextPage || pageLoading}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    !hasNextPage && styles.pageButtonTextDisabled,
                  ]}
                >
                  Suivant →
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F0FDF4" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  header: { fontSize: 24, fontWeight: "700", color: "#14532D" },
  subtitle: { marginTop: 4, color: "#6B7280", fontSize: 13 },
  failedCount: { color: "#DC2626", fontWeight: "700" },

  exportRow: {
    flexDirection: "row",
    gap: 8,
  },

  exportButton: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  exportButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12.5,
    letterSpacing: 0.3,
  },

  searchInput: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 14,
    fontSize: 14,
    color: "#111827",
  },

  list: { paddingHorizontal: 15, paddingBottom: 24, paddingTop: 16 },

  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#166534" },
  emptySubtitle: { fontSize: 13, color: "#6B7280", marginTop: 4, textAlign: "center" },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#166534",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  cardAccent: {
    width: 5,
    backgroundColor: "#22C55E",
  },

  cardContent: {
    flex: 1,
    padding: 16,
  },

  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  moduleBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  moduleBadgeText: { fontSize: 10, fontWeight: "700" },

  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  success: { backgroundColor: "#DCFCE7" },
  failed: { backgroundColor: "#FEE2E2" },
  successText: { color: "#15803D" },
  failedText: { color: "#DC2626" },
  statusText: { fontSize: 10, fontWeight: "700" },

  time: { marginLeft: "auto", color: "#9CA3AF", fontSize: 12 },

  action: { marginTop: 10, fontWeight: "700", fontSize: 16, color: "#14532D" },

  userRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  userName: { fontSize: 13, fontWeight: "600", color: "#111827" },
  email: { fontSize: 11, color: "#6B7280", marginTop: 1 },

  description: { marginTop: 10, color: "#4B5563", fontSize: 13, lineHeight: 19 },

  separator: { borderBottomWidth: 1, borderBottomColor: "#ECFDF5", marginVertical: 12 },

  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footer: { color: "#9CA3AF", fontSize: 12 },

  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },

  pageButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#16A34A",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  pageButtonDisabled: {
    borderColor: "#E5E7EB",
  },

  pageButtonText: {
    color: "#15803D",
    fontWeight: "700",
    fontSize: 13,
  },

  pageButtonTextDisabled: {
    color: "#D1D5DB",
  },

  pageIndicator: {
    minWidth: 70,
    alignItems: "center",
  },

  pageIndicatorText: {
    color: "#166534",
    fontWeight: "700",
    fontSize: 13,
  },
});