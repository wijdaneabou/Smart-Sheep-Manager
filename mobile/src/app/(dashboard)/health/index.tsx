import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { BcsScoreBadge } from "@/components/BcsScoreBadge";
import { getHerdBcsSummary, type BcsHerdSummaryResponse } from "@/services/animalBcsService";

export default function HealthDashboardScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<BcsHerdSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setError(null);
    const res = await getHerdBcsSummary();
    if (res.success) {
      setSummary(res.summary);
    } else {
      setError(res.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSummary().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {/* BANNIÈRE EN-TÊTE HUB SANTÉ & BCS */}
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.headerTitle}>Gestion Sanitaire & BCS 🩺</Text>
            <Text style={styles.headerSubtitle}>
              Suivi nutritionnel, état corporel et santé du troupeau
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#059669" />
          </View>
        ) : error || !summary ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error ?? "Erreur de chargement."}</Text>
          </View>
        ) : (
          <>
            {/* CARTES KPI SYNTHÈSE BCS */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{summary.totalEvaluated}</Text>
                <Text style={styles.kpiLabel}>Animaux évalués</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>
                  {summary.averageScore > 0 ? summary.averageScore.toFixed(1) : "-"}
                </Text>
                <Text style={styles.kpiLabel}>Score BCS Moyen</Text>
              </View>

              <View style={styles.kpiCard}>
                {summary.globalCategory ? (
                  <BcsScoreBadge
                    score={summary.averageScore}
                    label={summary.globalCategory.label}
                    color={summary.globalCategory.color}
                    size="sm"
                  />
                ) : (
                  <Text style={styles.kpiValue}>-</Text>
                )}
                <Text style={styles.kpiLabel}>État Troupeau</Text>
              </View>
            </View>

            {/* RÉPARTITION NUTRITIONNELLE PAR CATÉGORIE */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Répartition de l'état corporel</Text>

              <View style={styles.distributionContainer}>
                {/* Barres de répartition */}
                <View style={styles.distRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.distLabel}>🔴 Maigre (&lt; 2.0)</Text>
                  </View>
                  <Text style={styles.distValue}>{summary.distribution.THIN}</Text>
                </View>

                <View style={styles.distRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.distLabel}>🟠 Mince (2.0 - 2.9)</Text>
                  </View>
                  <Text style={styles.distValue}>{summary.distribution.MODERATE}</Text>
                </View>

                <View style={styles.distRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.distLabel}>🟢 Idéal (3.0 - 3.9)</Text>
                  </View>
                  <Text style={styles.distValue}>{summary.distribution.IDEAL}</Text>
                </View>

                <View style={styles.distRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.distLabel}>🟡 Gras (4.0 - 4.4)</Text>
                  </View>
                  <Text style={styles.distValue}>{summary.distribution.HEAVY}</Text>
                </View>

                <View style={styles.distRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.distLabel}>🔴 Obèse (&ge; 4.5)</Text>
                  </View>
                  <Text style={styles.distValue}>{summary.distribution.OBESE}</Text>
                </View>
              </View>
            </View>

            {/* ALERTES & ANIMAUX À SURVEILLER */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>⚠️ Attention nutritionnelle requise</Text>
                <Text style={styles.countBadge}>{summary.attentionList.length}</Text>
              </View>

              {summary.attentionList.length === 0 ? (
                <View style={styles.cleanStateBox}>
                  <Text style={styles.cleanStateIcon}>✅</Text>
                  <Text style={styles.cleanStateText}>
                    Aucun animal en sous-nutrition sévère ou obésité.
                  </Text>
                </View>
              ) : (
                summary.attentionList.map((item) => (
                  <Pressable
                    key={item.animalId}
                    onPress={() => router.push(`/herd/${item.animalId}/bcs` as any)}
                    style={styles.attentionRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.animalNameText}>{item.animalName}</Text>
                      {item.animalOfficialId ? (
                        <Text style={styles.animalIdText}>ID: {item.animalOfficialId}</Text>
                      ) : null}
                    </View>
                    <BcsScoreBadge
                      score={item.bcsScore}
                      label={item.category.label}
                      color={item.category.color}
                      size="sm"
                    />
                  </Pressable>
                ))
              )}
            </View>

            {/* BOUTON D'ACCÈS RAPIDE À LA LISTE ANIMAUX */}
            <Pressable
              onPress={() => router.push("/herd" as any)}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>
                📋 Accéder à la liste des animaux pour évaluer le BCS
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const PAGE_BG = "#FAF3EA";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  headerBanner: {
    backgroundColor: "#059669",
    borderRadius: 18,
    padding: 18,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 13, color: "#D1FAE5", marginTop: 4 },
  center: { padding: 40, alignItems: "center" },
  errorCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: { color: "#991B1B", fontSize: 13, textAlign: "center" },
  kpiGrid: {
    flexDirection: "row",
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  kpiValue: { fontSize: 20, fontWeight: "800", color: "#0F2A1D" },
  kpiLabel: { fontSize: 11, color: "#6B7280", marginTop: 4 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F2A1D" },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  countBadge: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  distributionContainer: {
    marginTop: 12,
    gap: 8,
  },
  distRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  distLabel: { fontSize: 13, color: "#374151", fontWeight: "600" },
  distValue: { fontSize: 14, fontWeight: "700", color: "#111827" },
  cleanStateBox: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
  },
  cleanStateIcon: { fontSize: 24 },
  cleanStateText: { fontSize: 12, color: "#059669", fontWeight: "600" },
  attentionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  animalNameText: { fontSize: 14, fontWeight: "700", color: "#111827" },
  animalIdText: { fontSize: 11, color: "#6B7280" },
  actionButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#059669",
  },
  actionButtonText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "700",
  },
});
