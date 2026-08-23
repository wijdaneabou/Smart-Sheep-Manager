import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import feedingService, {
  type FoodCostData,
} from "../../../services/feedingService";
import {
  Chip,
  EmptyState,
  ErrorMessage,
  LoadingScreen,
  parseNumber,
  formatNumber,
  todayInputValue,
} from "./components/FeedingShared";

type FoodCostGroup = FoodCostData["groups"][number];

const GROUP_BY_OPTIONS = [
  { value: "ANIMAL", label: "Par animal" },
  { value: "BATCH", label: "Par lot" },
  { value: "BATIMENT", label: "Par batiment" },
  { value: "MONTH", label: "Par mois" },
];

export default function CoutAlimentaireScreen() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(todayInputValue());
  const [groupBy, setGroupBy] = useState<"ANIMAL" | "BATCH" | "BATIMENT" | "MONTH">("ANIMAL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FoodCostData | null>(null);

  async function loadCostData() {
    setError(null);
    try {
      const result = await feedingService.getFoodCostPerAnimal({
        startDate,
        endDate,
        groupBy,
      });
      setData(result);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible de charger les couts alimentaires."
      );
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCostData().finally(() => setLoading(false));
    }, [startDate, endDate, groupBy])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadCostData();
    setRefreshing(false);
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#17633A" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Cout alimentaire</Text>
            <Text style={styles.subtitle}>
              Cout par animal et par periode
            </Text>
          </View>
        </View>

        {error ? <ErrorMessage message={error} /> : null}

        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Du</Text>
              <TextInput
                style={styles.filterInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Au</Text>
              <TextInput
                style={styles.filterInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
          <View style={styles.chipRow}>
            {GROUP_BY_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={groupBy === opt.value}
                onPress={() => setGroupBy(opt.value as any)}
              />
            ))}
          </View>
        </View>

        {data && (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="cash-outline" size={22} color="#17633A" />
                </View>
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle}>
                    Cout total alimentaire
                  </Text>
                  <Text style={styles.summarySubtitle}>
                    {data.summary.daysInPeriod} jour(s) • {data.summary.totalAnimals} animal{data.summary.totalAnimals !== 1 ? "x" : ""}
                  </Text>
                </View>
                <Text style={styles.summaryValue}>
                  {formatNumber(data.summary.totalCost)} DH
                </Text>
              </View>

              <View style={styles.summaryMetrics}>
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricValue}>
                    {formatNumber(data.summary.averageDailyCostPerAnimal)} DH
                  </Text>
                  <Text style={styles.summaryMetricLabel}>Cout/jour/animal</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricValue}>
                    {data.summary.averageCostPerKgGain != null
                      ? formatNumber(data.summary.averageCostPerKgGain)
                      : "N/A"}
                  </Text>
                  <Text style={styles.summaryMetricLabel}>Cout/kg de gain</Text>
                </View>
              </View>
            </View>

            {data.groups.length === 0 ? (
              <EmptyState
                icon="pie-chart-outline"
                title="Aucune donnee"
                text="Aucune distribution trouvee pour cette periode."
              />
            ) : (
              <View style={styles.groupList}>
                {data.groups.map((group) => (
                  <View key={group.groupKey} style={styles.groupCard}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupLabel}>{group.label}</Text>
                      <View style={styles.groupBadge}>
                        <Text style={styles.groupBadgeText}>
                          {group.numberOfAnimals} animal{group.numberOfAnimals !== 1 ? "x" : ""}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.groupMetrics}>
                      <View style={styles.groupMetric}>
                        <Text style={styles.groupMetricValue}>
                          {formatNumber(group.totalCost)} DH
                        </Text>
                        <Text style={styles.groupMetricLabel}>Cout total</Text>
                      </View>
                      <View style={styles.groupDivider} />
                      <View style={styles.groupMetric}>
                        <Text style={styles.groupMetricValue}>
                          {formatNumber(group.dailyCostPerAnimal)} DH
                        </Text>
                        <Text style={styles.groupMetricLabel}>Cout/jour/animal</Text>
                      </View>
                      <View style={styles.groupDivider} />
                      <View style={styles.groupMetric}>
                        <Text
                          style={[
                            styles.groupMetricValue,
                            { color: group.costPerKgGain != null ? "#17633A" : "#5C7468" },
                          ]}
                        >
                          {group.costPerKgGain != null
                            ? formatNumber(group.costPerKgGain)
                            : "N/A"}
                        </Text>
                        <Text style={styles.groupMetricLabel}>Cout/kg gain</Text>
                      </View>
                    </View>
                    <View style={styles.groupFooter}>
                      <Text style={styles.groupFooterText}>
                        {group.distributionCount} distribution{group.distributionCount !== 1 ? "s" : ""} •{" "}
                        {group.weightGainKg.toFixed(1)} kg de gain
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import { TextInput } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF6",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: "#10281D",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#5C7468",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  filterCard: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 14,
    gap: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterField: {
    flex: 1,
    gap: 6,
  },
  filterLabel: {
    color: "#2B4638",
    fontSize: 13,
    fontWeight: "800",
  },
  filterInput: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCEBE2",
    backgroundColor: "#FBFEFC",
    paddingHorizontal: 12,
    color: "#10281D",
    fontSize: 15,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryCard: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 14,
    gap: 12,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#E8F5EC",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    color: "#10281D",
    fontSize: 16,
    fontWeight: "900",
  },
  summarySubtitle: {
    color: "#5C7468",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  summaryValue: {
    color: "#17633A",
    fontSize: 18,
    fontWeight: "900",
  },
  summaryMetrics: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5FAF6",
    borderRadius: 10,
    padding: 12,
  },
  summaryMetric: {
    flex: 1,
    alignItems: "center",
  },
  summaryMetricValue: {
    color: "#10281D",
    fontSize: 16,
    fontWeight: "900",
  },
  summaryMetricLabel: {
    color: "#5C7468",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E2EFE7",
  },
  groupList: {
    gap: 10,
  },
  groupCard: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 14,
    gap: 10,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupLabel: {
    color: "#10281D",
    fontSize: 15,
    fontWeight: "900",
  },
  groupBadge: {
    borderRadius: 6,
    backgroundColor: "#F5FAF6",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  groupBadgeText: {
    color: "#5C7468",
    fontSize: 11,
    fontWeight: "800",
  },
  groupMetrics: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5FAF6",
    borderRadius: 10,
    padding: 10,
  },
  groupMetric: {
    flex: 1,
    alignItems: "center",
  },
  groupMetricValue: {
    color: "#10281D",
    fontSize: 14,
    fontWeight: "900",
  },
  groupMetricLabel: {
    color: "#5C7468",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  groupDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E2EFE7",
  },
  groupFooter: {
    marginTop: 4,
  },
  groupFooterText: {
    color: "#5C7468",
    fontSize: 12,
    fontWeight: "600",
  },
});
