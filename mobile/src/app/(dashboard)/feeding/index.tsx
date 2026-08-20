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
  type FeedDistribution,
  type FeedItem,
  type FeedRation,
} from "../../../services/feedingService";
import {
  MetricCard,
  NumberBlock,
  ErrorMessage,
  EmptyState,
  LoadingScreen,
  parseNumber,
  formatNumber,
  averageCost,
  targetLabel,
  startOfTodayIso,
  endOfTodayIso,
} from "./components/FeedingShared";
import CreateRationModal from "./components/CreateRationModal";
import ConsumptionModal from "./components/ConsumptionModal";
import AddFeedItemModal from "./components/AddFeedItemModal";
import PurchaseModal from "./components/PurchaseModal";

export default function FeedingScreen() {
  const router = useRouter();
  const [rations, setRations] = useState<FeedRation[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [distributions, setDistributions] = useState<FeedDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rationModalVisible, setRationModalVisible] = useState(false);
  const [consumptionModalVisible, setConsumptionModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);

  const activeRations = useMemo(
    () => rations.filter((ration) => ration.status === "ACTIVE").length,
    [rations]
  );

  const distributedToday = useMemo(
    () =>
      distributions.reduce(
        (sum, distribution) => sum + parseNumber(distribution.quantityDistributedKg),
        0
      ),
    [distributions]
  );

  const refusedToday = useMemo(
    () =>
      distributions.reduce(
        (sum, distribution) => sum + parseNumber(distribution.refusedQuantityKg),
        0
      ),
    [distributions]
  );

  const consumedToday = Math.max(distributedToday - refusedToday, 0);

  const animalsToday = useMemo(
    () =>
      distributions.reduce(
        (sum, distribution) => sum + (distribution.numberOfAnimals || 0),
        0
      ),
    [distributions]
  );

  const consumptionPerAnimalToday =
    animalsToday > 0 ? consumedToday / animalsToday : 0;

  async function loadFeedingData() {
    setError(null);
    try {
      const [rationList, itemList] = await Promise.all([
        feedingService.getFeedRations(),
        feedingService.getFeedItems(),
      ]);
      const distributionList = await feedingService.getFeedDistributions({
        startDate: startOfTodayIso(),
        endDate: endOfTodayIso(),
      });
      setRations(rationList);
      setFeedItems(itemList);
      setDistributions(distributionList);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible de charger l'alimentation."
      );
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFeedingData().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadFeedingData();
    setRefreshing(false);
  }

  async function handleRationCreated() {
    setSaving(true);
    await loadFeedingData();
    setSaving(false);
  }

  async function handleDistributionCreated() {
    setSaving(true);
    await loadFeedingData();
    setSaving(false);
  }

  async function handleItemCreated() {
    setSaving(true);
    await loadFeedingData();
    setSaving(false);
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
          <View style={styles.headerText}>
            <Text style={styles.title}>Alimentation</Text>
            <Text style={styles.subtitle}>
              Rations, stocks et suivi quotidien
            </Text>
          </View>
          <Pressable
            style={styles.iconButton}
            onPress={() => setRationModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="nutrition-outline" size={22} color="#17633A" />
            </View>
            <Text style={styles.statValue}>{activeRations}</Text>
            <Text style={styles.statLabel}>Rations actives</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="leaf-outline" size={22} color="#15803D" />
            </View>
            <Text style={styles.statValue}>{feedItems.length}</Text>
            <Text style={styles.statLabel}>Aliments</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="cash-outline" size={22} color="#047857" />
            </View>
            <Text style={styles.statValue}>{averageCost(rations)}</Text>
            <Text style={styles.statLabel}>Cout moyen DH/kg</Text>
          </View>
        </View>

        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <View style={styles.trackingTitleRow}>
              <Ionicons name="calendar-outline" size={20} color="#17633A" />
              <Text style={styles.trackingTitle}>Suivi du jour</Text>
            </View>
            <Pressable
              style={styles.trackingButton}
              onPress={() => setConsumptionModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.trackingButtonText}>Nouveau suivi</Text>
            </Pressable>
          </View>

          <View style={styles.trackingMetrics}>
            <View style={styles.trackingMetric}>
              <Text style={styles.trackingMetricValue}>
                {distributedToday.toFixed(1)} kg
              </Text>
              <Text style={styles.trackingMetricLabel}>Distribue</Text>
            </View>
            <View style={styles.trackingDivider} />
            <View style={styles.trackingMetric}>
              <Text style={[styles.trackingMetricValue, { color: "#15803D" }]}>
                {consumedToday.toFixed(1)} kg
              </Text>
              <Text style={styles.trackingMetricLabel}>Consomme</Text>
            </View>
            <View style={styles.trackingDivider} />
            <View style={styles.trackingMetric}>
              <Text style={[styles.trackingMetricValue, { color: "#B42318" }]}>
                {refusedToday.toFixed(1)} kg
              </Text>
              <Text style={styles.trackingMetricLabel}>Refus</Text>
            </View>
          </View>

          <View style={styles.dailySummary}>
            <Ionicons name="trending-up-outline" size={18} color="#17633A" />
            <Text style={styles.dailySummaryText}>
              {consumptionPerAnimalToday.toFixed(2)} kg par animal aujourd'hui
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.actionCard}
            onPress={() => setRationModalVisible(true)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="restaurant-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Nouvelle ration</Text>
              <Text style={styles.actionSubtitle}>
                Creer une formule alimentaire
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#5C7468" />
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => setItemModalVisible(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#15803D" }]}>
              <Ionicons name="cube-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Nouvel aliment</Text>
              <Text style={styles.actionSubtitle}>
                Ajouter au stock
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#5C7468" />
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push("/feeding/stock")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#047857" }]}>
              <Ionicons name="layers-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Stock & alertes</Text>
              <Text style={styles.actionSubtitle}>
                Voir le stock, les seuils et les peremptions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#5C7468" />
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push("/feeding/fcr")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#0F766E" }]}>
              <Ionicons name="trending-up-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Efficacite alimentaire</Text>
              <Text style={styles.actionSubtitle}>
                Suivre le FCR et optimiser les couts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#5C7468" />
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push("/feeding/cout-alimentaire")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#047857" }]}>
              <Ionicons name="calculator-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Cout alimentaire</Text>
              <Text style={styles.actionSubtitle}>
                Cout par animal et par periode
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#5C7468" />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Rations disponibles</Text>
            <Text style={styles.sectionSubtitle}>
              {rations.length} ration{rations.length !== 1 ? "s" : ""} enregistree{rations.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {error ? <ErrorMessage message={error} /> : null}

        {rations.length === 0 ? (
          <EmptyState
            icon="restaurant-outline"
            title="Aucune ration creee"
            text="Cree une formule pour calculer la quantite et le cout par animal."
            actionLabel="Creer une ration"
            onAction={() => setRationModalVisible(true)}
          />
        ) : (
          <View style={styles.rationList}>
            {rations.map((ration) => (
              <View key={ration.id} style={styles.rationCard}>
                <View style={styles.rationHeader}>
                  <View style={styles.rationIcon}>
                    <Ionicons name="restaurant" size={22} color="#17633A" />
                  </View>
                  <View style={styles.rationInfo}>
                    <Text style={styles.rationName}>{ration.name}</Text>
                    <Text style={styles.rationMeta}>
                      {targetLabel(ration.targetType)}
                      {ration.code ? ` • ${ration.code}` : ""}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: ration.status === "ACTIVE" ? "#D1FAE5" : "#FEF3C7" }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: ration.status === "ACTIVE" ? "#047857" : "#D97706" }
                    ]}>
                      {ration.status === "ACTIVE" ? "Actif" : ration.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.rationMetrics}>
                  <View style={styles.rationMetric}>
                    <Text style={styles.rationMetricValue}>
                      {formatNumber(ration.dailyRationPerAnimalKg)}
                    </Text>
                    <Text style={styles.rationMetricLabel}>kg/animal/j</Text>
                  </View>
                  <View style={styles.rationMetricDivider} />
                  <View style={styles.rationMetric}>
                    <Text style={styles.rationMetricValue}>
                      {formatNumber(ration.costPerKg)}
                    </Text>
                    <Text style={styles.rationMetricLabel}>DH/kg</Text>
                  </View>
                  <View style={styles.rationMetricDivider} />
                  <View style={styles.rationMetric}>
                    <Text style={styles.rationMetricValue}>
                      {(
                        parseNumber(ration.costPerKg) *
                        parseNumber(ration.dailyRationPerAnimalKg)
                      ).toFixed(2)}
                    </Text>
                    <Text style={styles.rationMetricLabel}>DH/ration</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <CreateRationModal
        visible={rationModalVisible}
        onClose={() => setRationModalVisible(false)}
        feedItems={feedItems}
        saving={saving}
        onRationCreated={handleRationCreated}
      />

      <ConsumptionModal
        visible={consumptionModalVisible}
        onClose={() => setConsumptionModalVisible(false)}
        rations={rations}
        saving={saving}
        onDistributionCreated={handleDistributionCreated}
      />

      <AddFeedItemModal
        visible={itemModalVisible}
        onClose={() => setItemModalVisible(false)}
        saving={saving}
        onItemCreated={handleItemCreated}
      />
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
    justifyContent: "space-between",
    gap: 12,
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
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17633A",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E8F5EC",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: "#10281D",
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: "#5C7468",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  trackingCard: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 16,
    gap: 14,
  },
  trackingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trackingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trackingTitle: {
    color: "#10281D",
    fontSize: 16,
    fontWeight: "900",
  },
  trackingButton: {
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: "#17633A",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  trackingButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  trackingMetrics: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5FAF6",
    borderRadius: 10,
    padding: 12,
  },
  trackingMetric: {
    flex: 1,
    alignItems: "center",
  },
  trackingMetricValue: {
    color: "#10281D",
    fontSize: 18,
    fontWeight: "900",
  },
  trackingMetricLabel: {
    color: "#5C7468",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  trackingDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E2EFE7",
  },
  dailySummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  dailySummaryText: {
    color: "#17633A",
    fontSize: 14,
    fontWeight: "800",
  },
  actionsRow: {
    gap: 10,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#17633A",
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: "#10281D",
    fontSize: 15,
    fontWeight: "900",
  },
  actionSubtitle: {
    color: "#5C7468",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#10281D",
    fontSize: 18,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#5C7468",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  rationList: {
    gap: 10,
  },
  rationCard: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 14,
    gap: 12,
  },
  rationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#E8F5EC",
    alignItems: "center",
    justifyContent: "center",
  },
  rationInfo: {
    flex: 1,
  },
  rationName: {
    color: "#10281D",
    fontSize: 15,
    fontWeight: "900",
  },
  rationMeta: {
    color: "#5C7468",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  rationMetrics: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5FAF6",
    borderRadius: 10,
    padding: 10,
  },
  rationMetric: {
    flex: 1,
    alignItems: "center",
  },
  rationMetricValue: {
    color: "#10281D",
    fontSize: 15,
    fontWeight: "900",
  },
  rationMetricLabel: {
    color: "#5C7468",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  rationMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E2EFE7",
  },
});
