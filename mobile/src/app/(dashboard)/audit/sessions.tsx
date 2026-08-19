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
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";
import api from "@/services/api";
import SubTabBar from "@/components/SubTabBar";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";

type Session = {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
  loginAt: string;
  logoutAt: string | null;
  isActive: boolean;
};

const PAGE_LIMIT = 15;

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

export default function SessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadSessions(targetPage: number, searchTerm: string = search) {
    try {
      const response = await api.get("/sessions", {
        params: {
          page: targetPage,
          limit: PAGE_LIMIT,
          search: searchTerm || undefined,
        },
      });

      const data: Session[] = response.data.sessions ?? response.data;
      setSessions(data);
      setHasNextPage(data.length === PAGE_LIMIT);
      setPage(targetPage);
    } catch (error) {
      console.log("Erreur chargement sessions :", error);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadSessions(1);
    }, [])
  );

  function handleSearchChange(text: string) {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setLoading(true);
      loadSessions(1, text);
    }, 400);
  }

  function goToNextPage() {
    if (!hasNextPage || pageLoading) return;
    setPageLoading(true);
    loadSessions(page + 1);
  }

  function goToPreviousPage() {
    if (page <= 1 || pageLoading) return;
    setPageLoading(true);
    loadSessions(page - 1);
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

      const url = `${api.defaults.baseURL}/sessions/export/${type}?${params.toString()}`;
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
        link.download = `sessions_${Date.now()}.${type}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        Alert.alert("Succès", "Fichier téléchargé.");
        return;
      }

      const fileUri = FileSystem.documentDirectory + `sessions_${Date.now()}.${type}`;
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

  const activeCount = sessions.filter((s) => s.isActive).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Sessions</Text>
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
          <Text style={styles.headerTitle}>Sessions</Text>
          <Text style={styles.headerSubtitle}>
            {sessions.length} session{sessions.length > 1 ? "s" : ""}
            {activeCount > 0 ? ` · ${activeCount} active${activeCount > 1 ? "s" : ""}` : ""}
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
            placeholder="Rechercher (nom, email, IP, appareil...)"
            placeholderTextColor="#B0B0B0"
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="shield-outline" size={36} color="#B0B0B0" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>
              {search ? "Aucun résultat" : "Aucune session enregistrée"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.cardAccent, { backgroundColor: item.isActive ? "#15803D" : "#D1D5DB" }]} />

            <View style={styles.cardContent}>
              <View style={styles.topRow}>
                <View
                  style={[
                    styles.statusBadge,
                    item.isActive ? styles.statusBadgeActive : styles.statusBadgeClosed,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: item.isActive ? "#15803D" : "#6B7280" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: item.isActive ? "#15803D" : "#4B5563" },
                    ]}
                  >
                    {item.isActive ? "Active" : "Fermée"}
                  </Text>
                </View>

                <Text style={styles.time}>
                  {new Date(item.loginAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.firstName?.charAt(0) ?? "?"}
                    {item.lastName?.charAt(0) ?? ""}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {item.firstName ? `${item.firstName} ${item.lastName}` : "Utilisateur inconnu"}
                  </Text>
                  {item.email && (
                    <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                  )}
                </View>
              </View>

              <View style={styles.deviceRow}>
                <Ionicons name="phone-portrait-outline" size={13} color={GREEN} />
                <Text style={styles.deviceValue} numberOfLines={1}>
                  {item.userAgent ?? "Appareil inconnu"}
                </Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.footerRow}>
                <View style={styles.footerItem}>
                  <Ionicons name="globe-outline" size={13} color="#999" />
                  <Text style={styles.footer}>{item.ip ?? "N/A"}</Text>
                </View>
                <Text style={styles.footer}>
                  {new Date(item.loginAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>

              {item.logoutAt && (
                <View style={styles.logoutRow}>
                  <Ionicons name="log-out-outline" size={12} color="#999" />
                  <Text style={styles.logoutText}>
                    Déconnecté à {new Date(item.logoutAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListFooterComponent={
          sessions.length > 0 ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
                onPress={goToPreviousPage}
                disabled={page <= 1 || pageLoading}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="chevron-back"
                  size={14}
                  color={page <= 1 ? "#D1D5DB" : GREEN}
                />
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

  emptyState: { alignItems: "center", marginTop: 60 },
  emptyTitle: { fontSize: 14, fontWeight: "600", color: "#666" },

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

  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeActive: { backgroundColor: "#F0FDF4" },
  statusBadgeClosed: { backgroundColor: "#F3F4F6" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  time: { color: "#999", fontSize: 12 },

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

  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  deviceValue: { fontSize: 12, color: "#444", flex: 1 },

  separator: { borderBottomWidth: 1, borderBottomColor: "#f5f5f5", marginVertical: 12 },

  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footer: { color: "#999", fontSize: 12 },

  logoutRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  logoutText: { color: "#999", fontSize: 11 },

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