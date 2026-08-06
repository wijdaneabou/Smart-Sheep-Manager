import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  getGrowthCurve,
  createWeightRecord,
  type GrowthCurveData,
  type GrowthDataPoint,
} from "@/services/animalWeightsService";
import { getBreedInfo } from "@/constants/breeds";
import { API_URL } from "@/services/api";
import { usePermissions } from "@/contexts/PermissionsContext"; // 👈 NEW IMPORT

export default function GrowthCurveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animalId = Number(id);
  const router = useRouter();
  const { hasPermission } = usePermissions(); // 👈 NEW

  const [data, setData] = useState<GrowthCurveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function fetchGrowthCurve() {
    setError(null);
    const result = await getGrowthCurve(animalId);
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchGrowthCurve().finally(() => setLoading(false));
    }, [animalId])
  );

  async function handleAddWeight() {
    router.push(`/herd/${animalId}/weights/add` as any);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Courbe de croissance</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Courbe de croissance</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "Aucune donnée."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const breedInfo = getBreedInfo(data.animal.breed);
  const points = data.dataPoints;

  if (points.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Courbe de croissance</Text>
          {/* 👇 Add Weight button - HERD:UPDATE */}
          {hasPermission('HERD', 'UPDATE') && (
            <Pressable onPress={handleAddWeight} style={styles.addButton}>
              <Text style={styles.addIcon}>➕</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Aucune mesure</Text>
          <Text style={styles.empty}>
            Aucune pesée enregistrée pour cet animal.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const weights = points.map((p) => p.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;

  const chartHeight = 200;
  const chartPadding = 20;
  const pointRadius = 5;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Courbe de croissance</Text>
        {/* 👇 Add Weight button - HERD:UPDATE */}
        {hasPermission('HERD', 'UPDATE') && (
          <Pressable onPress={handleAddWeight} style={styles.addButton}>
            <Text style={styles.addIcon}>➕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Animal info */}
        <View style={styles.animalInfo}>
          {data.animal.photoUrl ? (
            <Image
              source={{
                uri: data.animal.photoUrl.startsWith("http")
                  ? data.animal.photoUrl
                  : `${API_URL}${data.animal.photoUrl}`,
              }}
              style={styles.animalPhoto}
            />
          ) : (
            <Text style={styles.animalIcon}>{breedInfo.icon}</Text>
          )}
          <Text style={styles.animalName}>{data.animal.name}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data.totalMeasurements}</Text>
            <Text style={styles.statLabel}>Mesures</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {data.averageGmq.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>GMQ moyen (kg/j)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{maxWeight.toFixed(1)} kg</Text>
            <Text style={styles.statLabel}>Poids max</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Évolution du poids</Text>

          <View style={[styles.chart, { height: chartHeight }]}>
            {/* Y-axis labels */}
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>{maxWeight.toFixed(1)} kg</Text>
              <Text style={styles.yAxisLabel}>
                {(minWeight + weightRange / 2).toFixed(1)} kg
              </Text>
              <Text style={styles.yAxisLabel}>{minWeight.toFixed(1)} kg</Text>
            </View>

            {/* Chart area */}
            <View style={[styles.chartArea, { height: chartHeight }]}>
              {/* Grid lines */}
              <View style={[styles.gridLine, { top: 0 }]} />
              <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
              <View style={[styles.gridLine, { top: chartHeight - 1 }]} />

              {/* Line chart */}
              <View style={styles.lineChart}>
                {points.map((point, index) => {
                  const y =
                    chartHeight -
                    ((point.weight - minWeight) / weightRange) *
                      (chartHeight - pointRadius * 2) -
                    pointRadius;

                  const isLast = index === points.length - 1;
                  const xPosition = index === 0 ? 0 : (index / (points.length - 1)) * 100;

                  return (
                    <View
                      key={point.id}
                      style={[
                        styles.pointContainer,
                        {
                          left: `${xPosition}%`,
                          top: y,
                        },
                      ]}
                    >
                      {/* GMQ label */}
                      {point.gmq !== null && index > 0 && (
                        <Text style={styles.gmqLabel}>
                          GMQ: {point.gmq.toFixed(2)} kg/j
                        </Text>
                      )}

                      {/* Point */}
                      <View
                        style={[
                          styles.point,
                          {
                            backgroundColor: point.gmq !== null && point.gmq > 0
                              ? "#16a34a"
                              : point.gmq !== null && point.gmq < 0
                              ? "#dc2626"
                              : "#6b7280",
                          },
                        ]}
                      />

                      {/* Date label */}
                      <Text style={styles.dateLabel}>{point.dateStr}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Data table */}
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Détails des mesures</Text>
          {points.map((point) => (
            <View key={point.id} style={styles.tableRow}>
              <Text style={styles.tableDate}>{point.dateStr}</Text>
              <Text style={styles.tableWeight}>{point.weight.toFixed(1)} kg</Text>
              {point.bcs !== null && (
                <Text style={styles.tableBcs}>BCS: {point.bcs.toFixed(1)}</Text>
              )}
              {point.gmq !== null && (
                <Text
                  style={[
                    styles.tableGmq,
                    { color: point.gmq > 0 ? "#16a34a" : "#dc2626" },
                  ]}
                >
                  GMQ: {point.gmq.toFixed(2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PAGE_BG = "#faf3ea";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backButtonText: { fontSize: 26, color: "#1a1a1a", fontWeight: "400" },
  headerTitle: { fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },
  addButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#059669", borderRadius: 10 },
  addIcon: { fontSize: 18, color: "#fff" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  error: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 4 },
  empty: { fontSize: 13, color: "#888", textAlign: "center" },

  container: { padding: 16 },

  animalInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    justifyContent: "center",
  },
  animalIcon: { fontSize: 32 },
  animalPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  animalName: { fontSize: 18, fontWeight: "700", color: "#0F2A1D" },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  statValue: { fontSize: 18, fontWeight: "700", color: "#0F2A1D" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },

  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  chartTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },

  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  yAxis: {
    height: 200,
    justifyContent: "space-between",
    paddingRight: 8,
  },
  yAxisLabel: { fontSize: 10, color: "#999" },

  chartArea: {
    flex: 1,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#f0f0f0",
  },

  lineChart: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pointContainer: {
    position: "absolute",
    alignItems: "center",
  },
  point: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 9,
    color: "#999",
    marginTop: 2,
  },
  gmqLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 4,
    borderRadius: 4,
  },

  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  tableTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableDate: { fontSize: 12, color: "#555" },
  tableWeight: { fontSize: 12, fontWeight: "600", color: "#0F2A1D" },
  tableBcs: { fontSize: 11, color: "#888" },
  tableGmq: { fontSize: 11, fontWeight: "600" },
});