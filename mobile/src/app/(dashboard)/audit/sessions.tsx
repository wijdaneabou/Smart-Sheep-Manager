import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";
import api from "@/services/api";

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

// ═══════════════════════════════════════════════════════════════
//  Fonction multi‑plateforme pour récupérer le token
// ═══════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════
  //  Export : Mobile (FileSystem) vs Web (fetch + téléchargement)
  // ═══════════════════════════════════════════════════════════════
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

      // 🌐 WEB : Téléchargement via fetch
      if (Platform.OS === "web" || typeof window !== "undefined") {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `sessions_${Date.now()}.${type}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        Alert.alert("Succès", "Le fichier a été téléchargé.");
        return;
      }

      // 📱 MOBILE : Téléchargement via expo-file-system
      const download = await FileSystem.downloadAsync(
        url,
        `${FileSystem.documentDirectory}sessions_${Date.now()}.${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(download.uri);
      } else {
        Alert.alert("Succès", "Le fichier a été enregistré.");
      }
    } catch (err: any) {
      console.log("Erreur export :", err.message);
      Alert.alert("Erreur", err.message ?? "Impossible d'exporter.");
    } finally {
      setExporting(null);
    }
  }

  const activeCount = sessions.filter((s) => s.isActive).length;

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
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.header}>Les Sessions</Text>
            <Text style={styles.subtitle}>
              {sessions.length} session{sessions.length > 1 ? "s" : ""}
              {activeCount > 0 && (
                <Text style={styles.activeCount}> · {activeCount} active{activeCount > 1 ? "s" : ""}</Text>
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
          placeholder="Rechercher (nom, email, IP, appareil...)"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={handleSearchChange}
        />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔐</Text>
            <Text style={styles.emptyTitle}>
              {search ? "Aucun résultat" : "Aucune session enregistrée"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardAccent} />

            <View style={styles.cardContent}>
              <View style={styles.topRow}>
                <View
                  style={[
                    styles.statusBadge,
                    item.isActive ? styles.success : styles.failed,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.isActive ? styles.successText : styles.failedText,
                    ]}
                  >
                    {item.isActive ? "🟢 Active" : "🔴 Fermée"}
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
                  <Text style={styles.userName}>
                    {item.firstName ? `${item.firstName} ${item.lastName}` : "Utilisateur inconnu"}
                  </Text>
                  {item.email && <Text style={styles.email}>{item.email}</Text>}
                </View>
              </View>

              <View style={styles.deviceRow}>
                <Text style={styles.deviceLabel}>📱 Appareil</Text>
                <Text style={styles.deviceValue}>
                  {item.userAgent ?? "Inconnu"}
                </Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.footerRow}>
                <Text style={styles.footer}>🌐 {item.ip ?? "N/A"}</Text>
                <Text style={styles.footer}>
                  {new Date(item.loginAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>

              {item.logoutAt && (
                <Text style={styles.logoutText}>
                  🚪 Déconnecté à {new Date(item.logoutAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
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
                <Text style={[styles.pageButtonText, page <= 1 && styles.pageButtonTextDisabled]}>
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
                style={[styles.pageButton, !hasNextPage && styles.pageButtonDisabled]}
                onPress={goToNextPage}
                disabled={!hasNextPage || pageLoading}
                activeOpacity={0.8}
              >
                <Text style={[styles.pageButtonText, !hasNextPage && styles.pageButtonTextDisabled]}>
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
    position: "relative",
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

  header: { fontSize: 22, fontWeight: "700", color: "#14532D" },
  subtitle: { marginTop: 4, color: "#6B7280", fontSize: 13 },
  activeCount: { color: "#16A34A", fontWeight: "700" },

  exportRow: { flexDirection: "row", gap: 8 },
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
  exportButtonText: { color: "#fff", fontWeight: "700", fontSize: 12.5 },

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

  emptyState: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#166534" },

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

  cardAccent: { width: 5, backgroundColor: "#22C55E" },
  cardContent: { flex: 1, padding: 16 },

  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  success: { backgroundColor: "#DCFCE7" },
  failed: { backgroundColor: "#FEE2E2" },
  successText: { color: "#15803D" },
  failedText: { color: "#DC2626" },
  statusText: { fontSize: 11, fontWeight: "700" },
  time: { color: "#9CA3AF", fontSize: 12 },

  userRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  userName: { fontSize: 13, fontWeight: "600", color: "#111827" },
  email: { fontSize: 11, color: "#6B7280" },

  deviceRow: {
    marginTop: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deviceLabel: { fontSize: 11, color: "#166534", fontWeight: "700", marginBottom: 2 },
  deviceValue: { fontSize: 12, color: "#374151" },

  separator: { borderBottomWidth: 1, borderBottomColor: "#ECFDF5", marginVertical: 12 },

  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footer: { color: "#9CA3AF", fontSize: 12 },

  logoutText: { marginTop: 8, color: "#9CA3AF", fontSize: 11 },

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

  pageButtonDisabled: { borderColor: "#E5E7EB" },

  pageButtonText: { color: "#15803D", fontWeight: "700", fontSize: 13 },

  pageButtonTextDisabled: { color: "#D1D5DB" },

  pageIndicator: { minWidth: 70, alignItems: "center" },

  pageIndicatorText: { color: "#166534", fontWeight: "700", fontSize: 13 },
});