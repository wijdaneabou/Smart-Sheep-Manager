import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import api from "../../../services/api";

type HealthStatus = 'HEALTHY' | 'SURVEILLANCE' | 'SICK' | 'UNDER_TREATMENT' | 'RECOVERED';

const statusConfig: Record<HealthStatus, { label: string; color: string; bg: string; icon: string }> = {
  HEALTHY:        { label: 'Sain',          color: '#10B981', bg: '#D1FAE5', icon: '✅' },
  SURVEILLANCE:   { label: 'Surveillance',  color: '#F59E0B', bg: '#FEF3C7', icon: '👀' },
  SICK:           { label: 'Malade',        color: '#EF4444', bg: '#FEE2E2', icon: '🤒' },
  UNDER_TREATMENT:{ label: 'En traitement', color: '#F97316', bg: '#FFEDD5', icon: '💊' },
  RECOVERED:      { label: 'Rétabli',       color: '#3B82F6', bg: '#DBEAFE', icon: '💪' },
};

const severityConfig = {
  LOW:      { label: 'Faible',   color: '#10B981', bg: '#D1FAE5' },
  MEDIUM:   { label: 'Moyenne',  color: '#F59E0B', bg: '#FEF3C7' },
  HIGH:     { label: 'Élevée',   color: '#F97316', bg: '#FFEDD5' },
  CRITICAL: { label: 'Critique', color: '#EF4444', bg: '#FEE2E2' },
};

export default function HealthRecordsList() {
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRecords() {
    setError(null);
    try {
      const response = await api.get('/health/animals/2/records');
      setRecords(response.data.data);
    } catch (err) {
      setError("Erreur de chargement des dossiers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRecords();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  }

  const filteredRecords = records.filter((r) =>
    r.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
    String(r.animalId).includes(search)
  );

  // Live stat calculation for the Report Banner
  const attentionCount = records.filter((r) =>
    ['SURVEILLANCE', 'SICK', 'UNDER_TREATMENT'].includes(r.status)
  ).length;

  const getStatusInfo = (status: string) => {
    return statusConfig[status as HealthStatus] || { label: status, color: '#6B7280', bg: '#F3F4F6', icon: '❓' };
  };

  const getSeverityInfo = (severity: string) => {
    return severityConfig[severity as keyof typeof severityConfig] || { label: severity, color: '#6B7280', bg: '#F3F4F6' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Chargement des dossiers…</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Dossiers médicaux</Text>
            <Text style={styles.subtitle}>
              {filteredRecords.length} dossier{filteredRecords.length > 1 ? "s" : ""} enregistré{filteredRecords.length > 1 ? "s" : ""}
            </Text>
          </View>

          {/* Elevated Rapport Pill Button */}
          <Pressable
            style={({ pressed }) => [
              styles.reportHeaderPill,
              pressed && styles.reportHeaderPillPressed,
            ]}
            onPress={() => router.push("/health/report" as any)}
          >
            <View style={styles.reportPillIconBadge}>
              <Text style={styles.reportPillEmoji}>📊</Text>
            </View>
            <Text style={styles.reportPillText}>Rapport</Text>
            <View style={styles.livePulseDot} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par diagnostic ou animal…"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} style={styles.searchClear}>
              <Text style={styles.searchClearText}>✕</Text>
            </Pressable>
          )}
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {error}</Text>
          </View>
        )}

        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10B981"
              colors={["#10B981"]}
            />
          }
          ListHeaderComponent={
            /* Interactive Report Analytics Card Banner */
            <Pressable
              style={({ pressed }) => [
                styles.reportBannerCard,
                pressed && styles.reportBannerCardPressed,
              ]}
              onPress={() => router.push("/health/report" as any)}
            >
              <View style={styles.reportBannerLeft}>
                <View style={styles.reportBannerIconBg}>
                  <Text style={styles.reportBannerIcon}>📈</Text>
                </View>
                <View style={styles.reportBannerTextCol}>
                  <Text style={styles.reportBannerTitle}>Aperçu des Rapports</Text>
                  <Text style={styles.reportBannerSub}>
                    {attentionCount > 0
                      ? `${attentionCount} cas nécessitent un suivi actif`
                      : "Tous les animaux sont en bonne santé"}
                  </Text>
                </View>
              </View>

              <View style={styles.reportBannerCTA}>
                <Text style={styles.reportBannerCTAText}>Voir →</Text>
              </View>
            </Pressable>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIconContainer}>
                <Text style={styles.emptyStateIcon}>📂</Text>
              </View>
              <Text style={styles.emptyStateTitle}>Aucun dossier trouvé</Text>
              <Text style={styles.emptyStateSubtitle}>
                Aucun dossier médical ne correspond à votre recherche.
              </Text>
            </View>
          }
          ListFooterComponent={
            <Pressable
              style={({ pressed }) => [
                styles.addCard,
                pressed && styles.addCardPressed,
              ]}
              onPress={() => router.push("/health/create")}
            >
              <View style={styles.addIconCircle}>
                <Text style={styles.addIcon}>+</Text>
              </View>
              <Text style={styles.addCardText}>Ajouter un dossier médical</Text>
              <Text style={styles.addCardSubtext}>Créer une nouvelle fiche de santé</Text>
            </Pressable>
          }
          renderItem={({ item }) => {
            const statusInfo = getStatusInfo(item.status);
            const severityInfo = item.severity ? getSeverityInfo(item.severity) : null;

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => router.push(`/health/${item.id}/detail`)}
              >
                {/* Status accent strip */}
                <View style={[styles.cardAccent, { backgroundColor: statusInfo.color }]} />

                <View style={styles.cardInner}>
                  {/* Top Row */}
                  <View style={styles.cardTop}>
                    <View style={styles.animalMeta}>
                      <View style={[styles.animalAvatar, { backgroundColor: statusInfo.bg }]}>
                        <Text style={styles.animalAvatarText}>🐑</Text>
                      </View>
                      <View style={styles.animalTextBlock}>
                        <Text style={styles.animalName}>Animal #{item.animalId}</Text>
                        {item.diagnosis ? (
                          <Text style={styles.diagnosis} numberOfLines={1}>
                            {item.diagnosis}
                          </Text>
                        ) : (
                          <Text style={styles.diagnosisEmpty}>Aucun diagnostic</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.badgeStack}>
                      <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
                        <Text style={[styles.badgeText, { color: statusInfo.color }]}>
                          {statusInfo.icon} {statusInfo.label}
                        </Text>
                      </View>
                      {severityInfo && (
                        <View style={[styles.badge, { backgroundColor: severityInfo.bg }]}>
                          <Text style={[styles.badgeText, { color: severityInfo.color }]}>
                            {severityInfo.label}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Info Grid */}
                  <View style={styles.infoGrid}>
                    {item.symptoms && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Symptômes</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                          {item.symptoms}
                        </Text>
                      </View>
                    )}
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Date de création</Text>
                      <Text style={styles.infoValue}>
                        {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.cardActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.actionBtnPrimary,
                        pressed && styles.actionBtnPressed,
                      ]}
                      onPress={() => router.push(`/health/${item.animalId}/carnet`)}
                    >
                      <Text style={styles.actionBtnIcon}>📋</Text>
                      <Text style={styles.actionBtnTextPrimary}>Carnet</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.actionBtnSecondary,
                        pressed && styles.actionBtnSecondaryPressed,
                      ]}
                      onPress={() => router.push(`/health/${item.id}/detail`)}
                    >
                      <Text style={styles.actionBtnTextSecondary}>Voir le détail</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Modern White & Emerald Theme Styles ─── */
const WHITE = "#FFFFFF";
const LIGHT_BG = "#F9FAFB";
const BORDER_LIGHT = "#F3F4F6";
const PRIMARY_GREEN = "#10B981"; // Vibrant Emerald
const DARK_EMERALD = "#047857";
const SOFT_GREEN_BG = "#ECFDF5";
const DARK_GREEN = "#064E3B";
const TEXT_MAIN = "#111827";
const TEXT_MUTED = "#6B7280";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  container: { flex: 1, backgroundColor: WHITE },

  /* Loading */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: TEXT_MUTED,
    fontWeight: "600",
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: WHITE,
  },
  headerTitles: { flex: 1, paddingRight: 12 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: DARK_GREEN,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 4,
    fontWeight: "500",
  },

  /* Upgraded Header Rapport Pill */
  reportHeaderPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SOFT_GREEN_BG,
    paddingLeft: 6,
    paddingRight: 16,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  reportHeaderPillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  reportPillIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  reportPillEmoji: { fontSize: 14 },
  reportPillText: {
    color: DARK_EMERALD,
    fontWeight: "800",
    fontSize: 13,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PRIMARY_GREEN,
    position: "absolute",
    top: 6,
    right: 8,
  },

  /* Search */
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_BG,
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 16, marginRight: 10, opacity: 0.5 },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: TEXT_MAIN,
    fontWeight: "500",
  },
  searchClear: {
    padding: 6,
    marginLeft: 4,
  },
  searchClearText: {
    fontSize: 14,
    color: TEXT_MUTED,
    fontWeight: "700",
  },

  /* Error */
  errorBanner: {
    backgroundColor: "#FEF2F2",
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorBannerText: {
    color: "#991B1B",
    fontSize: 14,
    fontWeight: "600",
  },

  /* List */
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },

  /* Report Hero Banner (List Header) */
  reportBannerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SOFT_GREEN_BG,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  reportBannerCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  reportBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  reportBannerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  reportBannerIcon: { fontSize: 20 },
  reportBannerTextCol: { flex: 1 },
  reportBannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: DARK_GREEN,
  },
  reportBannerSub: {
    fontSize: 12,
    color: DARK_EMERALD,
    marginTop: 2,
    fontWeight: "600",
  },
  reportBannerCTA: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  reportBannerCTAText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "800",
  },

  /* Card */
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    flexDirection: "row",
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardAccent: {
    width: 6,
  },
  cardInner: {
    flex: 1,
    padding: 20,
  },

  /* Card Top */
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  animalMeta: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  animalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  animalAvatarText: { fontSize: 22 },
  animalTextBlock: { flex: 1 },
  animalName: {
    fontSize: 17,
    fontWeight: "800",
    color: TEXT_MAIN,
    letterSpacing: -0.3,
  },
  diagnosis: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 4,
    fontWeight: "500",
  },
  diagnosisEmpty: {
    fontSize: 14,
    color: "#D1D5DB",
    marginTop: 4,
    fontWeight: "500",
    fontStyle: "italic",
  },

  /* Badges */
  badgeStack: {
    gap: 6,
    alignItems: "flex-end",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: BORDER_LIGHT,
    marginVertical: 16,
  },

  /* Info Grid */
  infoGrid: {
    gap: 10,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_MAIN,
    flex: 1,
    textAlign: "right",
    marginLeft: 12,
  },

  /* Card Actions */
  cardActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    flex: 1,
  },
  actionBtnPrimary: {
    backgroundColor: PRIMARY_GREEN,
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionBtnSecondary: {
    backgroundColor: LIGHT_BG,
  },
  actionBtnSecondaryPressed: {
    backgroundColor: BORDER_LIGHT,
  },
  actionBtnIcon: { fontSize: 16, marginRight: 6 },
  actionBtnTextPrimary: {
    fontSize: 14,
    fontWeight: "700",
    color: WHITE,
  },
  actionBtnTextSecondary: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_MAIN,
  },

  /* Empty State */
  emptyState: {
    alignItems: "center",
    marginTop: 48,
    paddingHorizontal: 24,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: LIGHT_BG,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateIcon: { fontSize: 40 },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT_MAIN,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: "center",
    lineHeight: 22,
  },

  /* Add Card */
  addCard: {
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: "center",
    backgroundColor: LIGHT_BG,
  },
  addCardPressed: {
    backgroundColor: SOFT_GREEN_BG,
    borderColor: PRIMARY_GREEN,
  },
  addIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  addIcon: { fontSize: 24, color: PRIMARY_GREEN, fontWeight: "400" },
  addCardText: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT_MAIN,
  },
  addCardSubtext: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 4,
    fontWeight: "500",
  },
});