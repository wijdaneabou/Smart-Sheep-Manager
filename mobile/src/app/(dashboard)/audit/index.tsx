import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";
import api from "../../../services/api";
import SubTabBar from "@/components/SubTabBar";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";

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
  AUTH: { bg: "#EFF6FF", text: "#2563EB" },
  USERS: { bg: "#F5F3FF", text: "#7C3AED" },
  EXPLOITATION: { bg: "#F0FDF4", text: GREEN },
  VACCINATION: { bg: "#FEF3C7", text: "#D97706" },
};

function moduleStyle(module: string) {
  return MODULE_COLORS[module] ?? { bg: "#F0FDF4", text: GREEN };
}

const getToken = async (): Promise<string | null> => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem("accessToken");
  }
  try {
    return await SecureStore.getItemAsync("accessToken");
  } catch (error) {
    console.error("Erreur lors de la récupération du token :", error);
    return null;
  }
};

export default function AuditScreen() {
  const router = useRouter();
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

      const token = await getToken();
      if (!token) {
        Alert.alert("Erreur", "Token introuvable.");
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      if (search.trim()) params.set("search", search.trim());

      const url = `${api.defaults.baseURL}/audit/export/${type}?${params.toString()}`;
      console.log("🌐 Export URL:", url);

      if (Platform.OS === "web") {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `audit_${Date.now()}.${type}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        Alert.alert("Succès", "Fichier téléchargé.");
        return;
      }

      const fileUri = FileSystem.documentDirectory + `audit_${Date.now()}.${type}`;
      console.log("📁 Destination:", fileUri);

      const downloadResult = await FileSystem.downloadAsync(
        url,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Téléchargé:", downloadResult.uri, "status:", downloadResult.status);

      if (downloadResult.status !== 200) {
        throw new Error(`HTTP ${downloadResult.status}`);
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Alert.alert("Succès", "Le fichier a été enregistré.");
      }
    } catch (err: any) {
      console.error("❌ Erreur export:", err);
      Alert.alert("Erreur", err.message ?? "Impossible d'exporter.");
    } finally {
      setExporting(null);
    }
  }

  const failedCount = logs.filter((l) => l.result !== "SUCCESS").length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Journal d'audit</Text>
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Journal d'audit</Text>
          <Text style={styles.headerSubtitle}>
            {logs.length} événement{logs.length > 1 ? "s" : ""}
            {failedCount > 0 ? ` · ${failedCount} échec${failedCount > 1 ? "s" : ""}` : ""}
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.toolbarCard}>
        <View style={styles.exportRow}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport("csv")}
            disabled={exporting !== null}
            activeOpacity={0.85}
          >
            {exporting === "csv" ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={14} color="#fff" />
                <Text style={styles.exportButtonText}>CSV</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport("pdf")}
            disabled={exporting !== null}
            activeOpacity={0.85}
          >
            {exporting === "pdf" ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="document-outline" size={14} color="#fff" />
                <Text style={styles.exportButtonText}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <SubTabBar />

        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher (nom, module, action, IP...)"
            placeholderTextColor="#B0B0B0"
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={36} color="#B0B0B0" style={{ marginBottom: 10 }} />
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
          const isSuccess = item.result === "SUCCESS";
          return (
            <View style={styles.card}>
              <View style={[styles.cardAccent, { backgroundColor: isSuccess ? GREEN : "#DC2626" }]} />

              <View style={styles.cardContent}>
                <View style={styles.topRow}>
                  <View style={[styles.moduleBadge, { backgroundColor: mColor.bg }]}>
                    <Text style={[styles.moduleBadgeText, { color: mColor.text }]}>
                      {item.module}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isSuccess ? styles.statusBadgeSuccess : styles.statusBadgeFailed,
                    ]}
                  >
                    <Ionicons
                      name={isSuccess ? "checkmark" : "close"}
                      size={11}
                      color={isSuccess ? "#15803D" : "#DC2626"}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: isSuccess ? "#15803D" : "#DC2626" },
                      ]}
                    >
                      {item.result}
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

                <View style={styles.userRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.firstName?.charAt(0) ?? "?"}
                      {item.lastName?.charAt(0) ?? ""}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {item.firstName ? `${item.firstName} ${item.lastName}` : "Utilisateur supprimé"}
                    </Text>
                    {item.email && (
                      <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                    )}
                  </View>
                </View>

                {!!item.description && (
                  <Text style={styles.description}>{item.description}</Text>
                )}

                <View style={styles.separator} />

                <View style={styles.footerRow}>
                  <View style={styles.footerItem}>
                    <Ionicons name="globe-outline" size={13} color="#999" />
                    <Text style={styles.footer}>{item.ip}</Text>
                  </View>
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
                style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
                onPress={goToPreviousPage}
                disabled={page <= 1 || pageLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={14} color={page <= 1 ? "#D1D5DB" : GREEN} />
                <Text style={[styles.pageButtonText, page <= 1 && styles.pageButtonTextDisabled]}>
                  Précédent
                </Text>
              </TouchableOpacity>

              <View style={styles.pageIndicator}>
                {pageLoading ? (
                  <ActivityIndicator size="small" color={GREEN} />
                ) : (
                  <Text style={styles.pageIndicatorText}>Page {page}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.pageButton, !hasNextPage && styles.pageButtonDisabled]}
                onPress={goToNextPage}
                disabled={!hasNextPage || pageLoading}
                activeOpacity={0.8}
              >
                <Text style={[styles.pageButtonText, !hasNextPage && styles.pageButtonTextDisabled]}>
                  Suivant
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={!hasNextPage ? "#D1D5DB" : GREEN}
                />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CREAM },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN, textAlign: "center" },
  headerSubtitle: { fontSize: 12, color: "#888", textAlign: "center", marginTop: 1 },

  toolbarCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  exportRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
  },
  exportButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#ECECE6",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: "#1f2937" },

  list: { paddingHorizontal: 16, paddingBottom: 24 },

  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 14, fontWeight: "600", color: "#666" },
  emptySubtitle: { fontSize: 12, color: "#999", marginTop: 4, textAlign: "center" },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 14 },

  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  moduleBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  moduleBadgeText: { fontSize: 10, fontWeight: "700" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusBadgeSuccess: { backgroundColor: "#F0FDF4" },
  statusBadgeFailed: { backgroundColor: "#FEF2F2" },
  statusText: { fontSize: 10, fontWeight: "700" },

  time: { marginLeft: "auto", color: "#999", fontSize: 12 },

  action: { marginTop: 10, fontWeight: "800", fontSize: 15, color: "#111" },

  userRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { color: GREEN, fontWeight: "800", fontSize: 13 },
  userName: { fontSize: 13, fontWeight: "700", color: "#111" },
  email: { fontSize: 11, color: "#888", marginTop: 1 },

  description: { marginTop: 10, color: "#555", fontSize: 13, lineHeight: 19 },

  separator: { borderBottomWidth: 1, borderBottomColor: "#f5f5f5", marginVertical: 12 },

  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footer: { color: "#999", fontSize: 12 },

  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },

  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  pageButtonDisabled: { borderColor: "#E5E7EB" },

  pageButtonText: { color: GREEN, fontWeight: "700", fontSize: 13 },

  pageButtonTextDisabled: { color: "#D1D5DB" },

  pageIndicator: { minWidth: 70, alignItems: "center" },

  pageIndicatorText: { color: GREEN, fontWeight: "700", fontSize: 13 },
});