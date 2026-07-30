import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../services/api";

interface ReportData {
  summary: {
    totalAnimals: number;
    totalHealthRecords: number;
    morbidityRate: number;
    mortalityRate: number;
    avgCostPerAnimal: number;
    avgRecoveryDays: number;
  };
  statusDistribution: Record<string, number>;
  recentActivities: Array<{
    type: string;
    date: string;
    description: string;
  }>;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  HEALTHY:        { label: 'Sain',          color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
  SURVEILLANCE:   { label: 'Surveillance',  color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
  SICK:           { label: 'Malade',        color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
  UNDER_TREATMENT:{ label: 'En traitement', color: '#EA580C', bg: '#FFEDD5', dot: '#F97316' },
  RECOVERED:      { label: 'Rétabli',       color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
  PENDING:        { label: 'En attente',    color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
  DONE:           { label: 'Effectué',      color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
  OVERDUE:        { label: 'En retard',     color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
};

export default function HealthReportScreen() {
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setError(null);
    try {
      const response = await api.get("/health/reports/summary");
      setReport(response.data.data);
    } catch (err) {
      setError("Erreur de chargement du rapport");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchReport();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReport();
    setRefreshing(false);
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || {
      label: status,
      color: '#64748B',
      bg: '#F8FAFC',
      dot: '#94A3B8',
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Génération du rapport…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={18} color="#0F172A" />
          </Pressable>
          <Text style={styles.headerTitle}>Rapport sanitaire</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error ?? "Rapport introuvable."}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const { summary, statusDistribution, recentActivities } = report;
  const totalAnimals = summary.totalAnimals || 1;

  const kpiItems = [
    { label: "Total Animaux", value: summary.totalAnimals, sub: "Tête(s) enregistrée(s)", icon: "🐑" },
    { label: "Dossiers Médicaux", value: summary.totalHealthRecords, sub: "Consultations", icon: "📂" },
    { label: "Taux de Morbidité", value: `${summary.morbidityRate}%`, sub: "Cas détectés", icon: "🤒" },
    { label: "Taux de Mortalité", value: `${summary.mortalityRate}%`, sub: "Pertes enregistrées", icon: "⚠️" },
    { label: "Coût Moyen / Animal", value: `${summary.avgCostPerAnimal.toFixed(2)} MAD`, sub: "Dépenses de santé", icon: "💰" },
    { label: "Durée de Guérison", value: `${summary.avgRecoveryDays} j`, sub: "Moyenne estimée", icon: "⏱️" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={18} color="#0F172A" />
        </Pressable>

        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTag}>ANALYTIQUE</Text>
          <Text style={styles.headerTitle}>Rapport sanitaire</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
            colors={["#10B981"]}
          />
        }
      >
        {/* KPI Metrics Grid */}
        <View style={styles.kpiGrid}>
          {kpiItems.map((kpi, idx) => (
            <View key={idx} style={styles.kpiCard}>
              <View style={styles.kpiCardTop}>
                <Text style={styles.kpiIcon}>{kpi.icon}</Text>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
              </View>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiSub}>{kpi.sub}</Text>
            </View>
          ))}
        </View>

        {/* Status Distribution */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Répartition des statuts</Text>
            <Text style={styles.sectionBadge}>En direct</Text>
          </View>

          {Object.keys(statusDistribution).length === 0 ? (
            <Text style={styles.emptyText}>Aucune donnée disponible</Text>
          ) : (
            Object.entries(statusDistribution).map(([status, count]) => {
              const info = getStatusInfo(status);
              const percentage = Math.round((count / totalAnimals) * 100);

              return (
                <View key={status} style={styles.statusRow}>
                  <View style={styles.statusHeaderRow}>
                    <View style={styles.statusLabelGroup}>
                      <View style={[styles.statusDot, { backgroundColor: info.dot }]} />
                      <Text style={styles.statusLabelText}>{info.label}</Text>
                    </View>
                    <View style={styles.statusValueGroup}>
                      <Text style={styles.statusCountText}>{count}</Text>
                      <Text style={styles.statusPercentageText}>({percentage}%)</Text>
                    </View>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: info.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Recent Activities */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dernières activités</Text>
            <Text style={styles.sectionSubCount}>{recentActivities.length} récents</Text>
          </View>

          {recentActivities.length === 0 ? (
            <Text style={styles.emptyText}>Aucune activité récente</Text>
          ) : (
            recentActivities.map((activity, index) => {
              const icon =
                activity.type === "health_record"
                  ? "🏥"
                  : activity.type === "treatment"
                  ? "💊"
                  : "💉";

              const isLast = index === recentActivities.length - 1;

              return (
                <View
                  key={index}
                  style={[styles.activityItem, isLast && styles.activityItemLast]}
                >
                  <View style={styles.activityAvatar}>
                    <Text style={{ fontSize: 16 }}>{icon}</Text>
                  </View>

                  <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityDate}>
                      {new Date(activity.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Modern Ultra White & Emerald Palette ─── */
const COLOR_BG = "#FFFFFF";
const COLOR_SURFACE = "#FFFFFF";
const COLOR_BORDER = "#F1F5F9";
const COLOR_PRIMARY = "#10B981"; // Emerald
const COLOR_TEXT_DARK = "#0F172A"; // Slate 900
const COLOR_TEXT_MUTED = "#64748B"; // Slate 500

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLOR_BG },
  container: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },

  /* Loading & Error */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLOR_BG,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLOR_TEXT_MUTED,
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#991B1B",
    fontWeight: "600",
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: COLOR_BG,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: {
    opacity: 0.8,
  },
  headerTitleBlock: {
    alignItems: "center",
  },
  headerTag: {
    fontSize: 10,
    fontWeight: "800",
    color: COLOR_PRIMARY,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLOR_TEXT_DARK,
    letterSpacing: -0.4,
  },

  /* KPI Grid */
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: COLOR_SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  kpiCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  kpiIcon: {
    fontSize: 14,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLOR_TEXT_MUTED,
    flex: 1,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLOR_TEXT_DARK,
    letterSpacing: -0.5,
  },
  kpiSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
    fontWeight: "500",
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: COLOR_SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLOR_TEXT_DARK,
    letterSpacing: -0.3,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: COLOR_PRIMARY,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sectionSubCount: {
    fontSize: 12,
    fontWeight: "600",
    color: COLOR_TEXT_MUTED,
  },
  emptyText: {
    fontSize: 13,
    color: COLOR_TEXT_MUTED,
    textAlign: "center",
    paddingVertical: 16,
  },

  /* Status Row */
  statusRow: {
    marginBottom: 14,
  },
  statusHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statusLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLOR_TEXT_DARK,
  },
  statusValueGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusCountText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLOR_TEXT_DARK,
  },
  statusPercentageText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLOR_TEXT_MUTED,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLOR_BORDER,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },

  /* Activity Timeline */
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDER,
    gap: 12,
  },
  activityItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 13,
    fontWeight: "600",
    color: COLOR_TEXT_DARK,
    lineHeight: 18,
  },
  activityDate: {
    fontSize: 11,
    color: COLOR_TEXT_MUTED,
    marginTop: 4,
    fontWeight: "500",
  },
});