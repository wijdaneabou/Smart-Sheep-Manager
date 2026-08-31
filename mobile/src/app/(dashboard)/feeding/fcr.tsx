import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import feedingService from "../../../services/feedingService";
import {
  Chip,
  EmptyState,
  ErrorMessage,
  LoadingScreen,
  parseNumber,
  formatNumber,
  todayInputValue,
} from "./components/FeedingShared";

type FCRGroup = {
  groupKey: string;
  label: string;
  totalConsumptionKg: number;
  weightGainKg: number;
  fcr: number | null;
  animalCount: number;
};

type FCRSummary = {
  period: { startDate: string; endDate: string };
  groupBy: string;
  totalGroups: number;
  groupsWithFCR: number;
  averageFCR: number | null;
  objectiveFCR: number;
  totalConsumptionKg: number;
  totalWeightGainKg: number;
};

type FCRData = {
  summary: FCRSummary;
  groups: FCRGroup[];
};

const GROUP_BY_OPTIONS = [
  { value: "ANIMAL", label: "Par animal" },
  { value: "BATCH", label: "Par lot" },
  { value: "BATIMENT", label: "Par batiment" },
  { value: "GLOBAL", label: "Global" },
];

export default function FCRScreen() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(todayInputValue());
  const [groupBy, setGroupBy] = useState<"ANIMAL" | "BATCH" | "BATIMENT" | "GLOBAL">("ANIMAL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FCRData | null>(null);

  async function loadFCR() {
    setError(null);
    try {
      const result = await feedingService.getFCR({
        startDate,
        endDate,
        groupBy,
      });
      setData(result);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible de charger le FCR."
      );
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFCR().finally(() => setLoading(false));
    }, [startDate, endDate, groupBy])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadFCR();
    setRefreshing(false);
  }

  const fcrColor = useMemo(() => {
    if (!data) return "#5C7468";
    const avg = data.summary.averageFCR;
    if (avg == null) return "#5C7468";
    if (avg < 5.0) return "#17633A";
    if (avg <= 6.0) return "#D97706";
    return "#B42318";
  }, [data]);

  const fcrStatus = useMemo(() => {
    if (!data) return "—";
    const avg = data.summary.averageFCR;
    if (avg == null) return "N/A";
    if (avg < 5.0) return "Efficace";
    if (avg <= 6.0) return "Acceptable";
    return "A ameliorer";
  }, [data]);

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
            <Text style={styles.title}>FCR et efficacite</Text>
            <Text style={styles.subtitle}>
              Feed Conversion Ratio — objectif {"<"} 5.0
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
                  <Ionicons name="analytics-outline" size={22} color="#17633A" />
                </View>
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle}>FCR moyen</Text>
                  <Text style={styles.summarySubtitle}>
                    {data.summary.groupsWithFCR} groupe{data.summary.groupsWithFCR !== 1 ? "s" : ""} calcule{data.summary.groupsWithFCR !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={[styles.fcrBadge, { backgroundColor: fcrColor }]}>
                  <Text style={styles.fcrValue}>
                    {data.summary.averageFCR != null ? data.summary.averageFCR.toFixed(2) : "N/A"}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryMetrics}>
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricValue}>
                    {data.summary.totalConsumptionKg.toFixed(1)} kg
                  </Text>
                  <Text style={styles.summaryMetricLabel}>Consommation totale</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricValue}>
                    {data.summary.totalWeightGainKg.toFixed(1)} kg
                  </Text>
                  <Text style={styles.summaryMetricLabel}>Gain de poids total</Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: fcrColor }]} />
                <Text style={[styles.statusText, { color: fcrColor }]}>
                  {fcrStatus}
                </Text>
                <Text style={styles.statusObjective}>
                  Objectif: {data.summary.objectiveFCR.toFixed(1)}
                </Text>
              </View>
            </View>

            {data.groups.length === 0 ? (
              <EmptyState
                icon="bar-chart-outline"
                title="Aucune donnee"
                text="Aucune distribution ou mesure de poids trouvee pour cette periode."
              />
            ) : (
              <View style={styles.groupList}>
                {data.groups.map((group) => (
                  <View key={group.groupKey} style={styles.groupCard}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupLabel}>{group.label}</Text>
                      <View style={styles.groupBadge}>
                        <Text style={styles.groupBadgeText}>
                          {group.animalCount} animal{group.animalCount !== 1 ? "x" : ""}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.groupMetrics}>
                      <View style={styles.groupMetric}>
                        <Text style={styles.groupMetricValue}>
                          {group.totalConsumptionKg.toFixed(1)} kg
                        </Text>
                        <Text style={styles.groupMetricLabel}>Consommation</Text>
                      </View>
                      <View style={styles.groupDivider} />
                      <View style={styles.groupMetric}>
                        <Text style={styles.groupMetricValue}>
                          {group.weightGainKg.toFixed(1)} kg
                        </Text>
                        <Text style={styles.groupMetricLabel}>Gain poids</Text>
                      </View>
                      <View style={styles.groupDivider} />
                      <View style={styles.groupMetric}>
                        <Text
                          style={[
                            styles.groupMetricValue,
                            { color: group.fcr != null ? (group.fcr < 5.0 ? "#17633A" : group.fcr <= 6.0 ? "#D97706" : "#B42318") : "#5C7468" },
                          ]}
                        >
                          {group.fcr != null ? group.fcr.toFixed(2) : "N/A"}
                        </Text>
                        <Text style={styles.groupMetricLabel}>FCR</Text>
                      </View>
                    </View>
                    {group.fcr != null && (
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            {
                              width: `${Math.min(100, (group.fcr / 8) * 100)}%`,
                              backgroundColor: group.fcr < 5.0 ? "#17633A" : group.fcr <= 6.0 ? "#D97706" : "#B42318",
                            },
                          ]}
                        />
                      </View>
                    )}
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
  headerText: {
    flex: 1,
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
  fcrBadge: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fcrValue: {
    color: "#FFFFFF",
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
  },
  statusObjective: {
    marginLeft: "auto",
    color: "#5C7468",
    fontSize: 13,
    fontWeight: "700",
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
  barContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2EFE7",
    overflow: "hidden",
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
});
