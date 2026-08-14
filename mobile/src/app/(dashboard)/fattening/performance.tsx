import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";

import {
  compareBatchPerformance,
  type BatchPerformance,
  type BatchPerformanceRankings,
} from "../../../services/fatteningService";
import { BackButton } from "../../../components/BackButton";

const GREEN = "#14532d";
const GREEN_EMERALD = "#059669";

function formatGmq(gmq: number | null): string {
  if (gmq === null) return "—";
  return `${gmq.toFixed(0)} g/j`;
}

function formatFcr(fcr: number | null): string {
  if (fcr === null) return "—";
  return fcr.toFixed(2);
}

function formatCost(cost: number | null): string {
  if (cost === null) return "—";
  return `${cost.toFixed(2)} €/kg`;
}

function formatStdDev(std: number | null): string {
  if (std === null) return "—";
  return `${std.toFixed(2)} kg`;
}

function getHomogeneityColor(rating: string | null): string {
  switch (rating) {
    case "EXCELLENT":
      return GREEN_EMERALD;
    case "GOOD":
      return "#4d7c05";
    case "FAIR":
      return "#b45309";
    case "POOR":
      return "#dc2626";
    default:
      return "#666";
  }
}

function getHomogeneityLabel(rating: string | null): string {
  switch (rating) {
    case "EXCELLENT":
      return "Excellente";
    case "GOOD":
      return "Bonne";
    case "FAIR":
      return "Moyenne";
    case "POOR":
      return "Pauvre";
    default:
      return "N/A";
  }
}

function formatWeightGain(gain: number | null): string {
  if (gain === null) return "—";
  return `+${gain.toFixed(1)} kg`;
}

type SortKey = "gmq" | "fcr" | "costPerKgGain" | "weightStdDev" | "batchName";

export default function FatteningPerformanceScreen() {
  const [batches, setBatches] = useState<BatchPerformance[]>([]);
  const [rankings, setRankings] = useState<BatchPerformanceRankings>({
    bestGmq: [],
    bestFcr: [],
    bestCostPerKg: [],
    bestHomogeneity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("gmq");
  const [sortAsc, setSortAsc] = useState(false);

  async function fetchPerformance() {
    setError(null);
    const result = await compareBatchPerformance({});
    if (result.success) {
      setBatches(result.batches);
      setRankings(result.rankings);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPerformance().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchPerformance();
    setRefreshing(false);
  }

  function isBest(batchId: number, ranking: number[]): boolean {
    return ranking.length > 0 && ranking[0] === batchId;
  }

  const sortedBatches = [...batches].sort((a, b) => {
    let aVal: number;
    let bVal: number;
    switch (sortKey) {
      case "gmq":
        aVal = a.gmq ?? -Infinity;
        bVal = b.gmq ?? -Infinity;
        break;
      case "fcr":
        aVal = a.fcr ?? Infinity;
        bVal = b.fcr ?? Infinity;
        break;
      case "costPerKgGain":
        aVal = a.costPerKgGain ?? Infinity;
        bVal = b.costPerKgGain ?? Infinity;
        break;
      case "weightStdDev":
        aVal = a.weightStdDev ?? Infinity;
        bVal = b.weightStdDev ?? Infinity;
        break;
      case "batchName":
        aVal = 0;
        bVal = 0;
        return a.batchName.localeCompare(b.batchName);
      default:
        return 0;
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  function renderBatchItem({ item }: { item: BatchPerformance }) {
    const isBestGmq = isBest(item.batchId, rankings.bestGmq);
    const isBestFcr = isBest(item.batchId, rankings.bestFcr);
    const isBestCost = isBest(item.batchId, rankings.bestCostPerKg);
    const isBestHomogeneity = isBest(item.batchId, rankings.bestHomogeneity);

    const gmqColor = isBestGmq ? GREEN_EMERALD : "#15803D";
    const fcrColor = isBestFcr ? GREEN_EMERALD : "#15803D";
    const costColor = isBestCost ? GREEN_EMERALD : "#15803D";
    const homogColor = isBestHomogeneity ? GREEN_EMERALD : getHomogeneityColor(item.homogeneityRating);

    const avgGain =
      item.initialWeight && item.currentWeight
        ? (item.currentWeight - item.initialWeight).toFixed(2)
        : "—";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.batchName} numberOfLines={1}>
            {item.batchName}
          </Text>
          <Text style={styles.batchId}>#{item.batchId}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "COMPLETED"
                    ? "#DBEAFE"
                    : item.status === "ACTIVE"
                    ? "#DCFCE7"
                    : "#FEE2E2",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.status === "COMPLETED"
                      ? "#1D4ED8"
                      : item.status === "ACTIVE"
                      ? "#15803D"
                      : "#DC2626",
                },
              ]}
            >
              {item.status === "COMPLETED"
                ? "Terminé"
                : item.status === "ACTIVE"
                ? "En cours"
                : "Annulé"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Animaux</Text>
          <Text style={styles.infoValue}>{item.animalCount}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Durée (jours)</Text>
          <Text style={styles.infoValue}>{item.daysElapsed}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Poids initial → actuel</Text>
          <Text style={styles.infoValue}>
            {item.initialWeight.toFixed(2)} → {item.currentWeight?.toFixed(2) ?? "—"} kg
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Gain total</Text>
          <Text style={styles.infoValue}>{formatWeightGain(item.totalWeightGain)}</Text>
        </View>

        <View style={styles.kpiGrid}>
          <KpiBox
            label="GMQ (g/j)"
            value={formatGmq(item.gmq)}
            subValue={
              item.averageDailyGmq !== null
                ? `${Math.round(item.averageDailyGmq)} g/j moy.`
                : undefined
            }
            isBest={isBestGmq}
            color={gmqColor}
          />
          <KpiBox
            label="FCR"
            value={formatFcr(item.fcr)}
            subValue={item.totalFeedKg > 0 ? `${item.totalFeedKg.toFixed(1)} kg feed` : undefined}
            isBest={isBestFcr}
            color={fcrColor}
          />
          <KpiBox
            label="Coût/kg gain"
            value={formatCost(item.costPerKgGain)}
            subValue={item.totalCost > 0 ? `Total: ${item.totalCost.toFixed(0)} €` : undefined}
            isBest={isBestCost}
            color={costColor}
          />
          <KpiBox
            label="Homogénéité (σ)"
            value={formatStdDev(item.weightStdDev)}
            subValue={
              item.homogeneityRating
                ? getHomogeneityLabel(item.homogeneityRating)
                : undefined
            }
            isBest={isBestHomogeneity}
            color={homogColor}
          />
        </View>

        {item.weightCount > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Poids min / max</Text>
            <Text style={styles.infoValue}>
              {item.weightMin !== null ? `${item.weightMin.toFixed(1)} / ${item.weightMax?.toFixed(1) ?? "—"} kg` : "—"}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
        <Text style={styles.headerTitle}>Performance par lot</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Trier par :</Text>
        <FlatList
          data={[
            { key: "gmq" as SortKey, label: "GMQ" },
            { key: "fcr" as SortKey, label: "FCR" },
            { key: "costPerKgGain" as SortKey, label: "Coût/kg" },
            { key: "weightStdDev" as SortKey, label: "Homogénéité" },
            { key: "batchName" as SortKey, label: "Nom" },
          ]}
          horizontal
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.sortPill,
                sortKey === item.key && styles.sortPillActive,
              ]}
              onPress={() => {
                if (sortKey === item.key) {
                  setSortAsc(!sortAsc);
                } else {
                  setSortKey(item.key);
                  setSortAsc(false);
                }
              }}
            >
              <Text
                style={[
                  styles.sortPillText,
                  sortKey === item.key && styles.sortPillTextActive,
                ]}
              >
                {item.label} {sortKey === item.key ? (sortAsc ? "↑" : "↓") : ""}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : batches.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Aucun lot à comparer</Text>
          <Text style={styles.empty}>
            Aucun lot d'engraissement n'est disponible pour la comparaison.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedBatches}
          keyExtractor={(item) => String(item.batchId)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={renderBatchItem}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      )}
    </SafeAreaView>
  );
}

function KpiBox({
  label,
  value,
  subValue,
  isBest,
  color,
}: {
  label: string;
  value: string;
  subValue?: string;
  isBest: boolean;
  color: string;
}) {
  return (
    <View style={styles.kpiBox}>
      <View style={styles.kpiHeader}>
        <Text style={styles.kpiLabel}>{label}</Text>
        {isBest && (
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>★ Meilleur</Text>
          </View>
        )}
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      {subValue && <Text style={styles.kpiSubValue}>{subValue}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: GREEN, flex: 1 },

  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  sortLabel: { fontSize: 13, fontWeight: "600", color: "#444" },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  sortPillActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  sortPillText: { fontSize: 12, fontWeight: "600", color: "#555" },
  sortPillTextActive: { color: "#fff" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  error: { color: "#dc2626", marginHorizontal: 16, marginBottom: 8, fontSize: 13 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 4 },
  empty: { fontSize: 13, color: "#888", textAlign: "center", marginHorizontal: 32 },

  listContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  batchName: { fontSize: 17, fontWeight: "800", color: GREEN, flex: 1, marginRight: 8 },
  batchId: { fontSize: 11, color: "#999", fontWeight: "600" },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 13, color: "#666", fontWeight: "600" },
  infoValue: { fontSize: 13, fontWeight: "700", color: "#111" },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  kpiBox: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
  },
  kpiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  kpiLabel: { fontSize: 11, color: "#666", fontWeight: "600" },
  kpiValue: { fontSize: 16, fontWeight: "800" },
  kpiSubValue: { fontSize: 10, color: "#888", fontWeight: "500", marginTop: 2 },
  bestBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bestBadgeText: { fontSize: 9, fontWeight: "700", color: "#92400E" },
});
