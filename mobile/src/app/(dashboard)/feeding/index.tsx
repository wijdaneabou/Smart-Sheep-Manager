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

const GREEN = "#14532d";
const BG = "#faf6f1";
const BORDER = "#ECECE6";
const SOFT_GREEN = "#f5f5f0";
const TEXT_MUTED = "#8a8578";

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Alimentation</Text>
            <Text style={styles.subtitle}>
              Rations, stocks et suivi quotidien
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.9 }]}
            onPress={() => setRationModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="nutrition-outline" size={20} color={GREEN} />
            </View>
            <Text style={styles.statValue}>{activeRations}</Text>
            <Text style={styles.statLabel}>Rations actives</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="leaf-outline" size={20} color={GREEN} />
            </View>
            <Text style={styles.statValue}>{feedItems.length}</Text>
            <Text style={styles.statLabel}>Aliments</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="cash-outline" size={20} color={GREEN} />
            </View>
            <Text style={styles.statValue}>{averageCost(rations)}</Text>
            <Text style={styles.statLabel}>Cout moyen DH/kg</Text>
          </View>
        </View>

        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <View style={styles.trackingTitleRow}>
              <View style={styles.trackingIconWrap}>
                <Ionicons name="calendar-outline" size={14} color={GREEN} />
              </View>
              <Text style={styles.trackingTitle}>Suivi du jour</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.trackingButton, pressed && { opacity: 0.9 }]}
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
              <Text style={[styles.trackingMetricValue, { color: "#DC2626" }]}>
                {refusedToday.toFixed(1)} kg
              </Text>
              <Text style={styles.trackingMetricLabel}>Refus</Text>
            </View>
          </View>

          <View style={styles.dailySummary}>
            <Ionicons name="trending-up-outline" size={18} color={GREEN} />
            <Text style={styles.dailySummaryText}>
              {consumptionPerAnimalToday.toFixed(2)} kg par animal aujourd'hui
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => setRationModalVisible(true)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="restaurant-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Nouvelle ration</Text>
              <Text style={styles.actionSubtitle}>
                Creer une formule alimentaire
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#c9c4b8" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => setItemModalVisible(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#D97706" }]}>
              <Ionicons name="cube-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Nouvel aliment</Text>
              <Text style={styles.actionSubtitle}>
                Ajouter au stock
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#c9c4b8" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => router.push("/feeding/stock")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#2563EB" }]}>
              <Ionicons name="layers-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Stock & alertes</Text>
              <Text style={styles.actionSubtitle}>
                Voir le stock, les seuils et les peremptions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#c9c4b8" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => router.push("/feeding/fcr")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#7C3AED" }]}>
              <Ionicons name="trending-up-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Efficacite alimentaire</Text>
              <Text style={styles.actionSubtitle}>
                Suivre le FCR et optimiser les couts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#c9c4b8" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => router.push("/feeding/cout-alimentaire")}
          >
            <View style={[styles.actionIcon, { backgroundColor: GREEN }]}>
              <Ionicons name="calculator-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Cout alimentaire</Text>
              <Text style={styles.actionSubtitle}>
                Cout par animal et par periode
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#c9c4b8" />
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

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <Text style={styles.errorTextInline}>{error}</Text>
          </View>
        ) : null}

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
                    <Ionicons name="restaurant" size={20} color={GREEN} />
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
                    { backgroundColor: ration.status === "ACTIVE" ? "#DCFCE7" : "#FEF3C7" }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: ration.status === "ACTIVE" ? "#15803D" : "#D97706" }
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
    backgroundColor: BG,
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
    color: GREEN,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: SOFT_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  trackingCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  trackingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trackingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  trackingIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: SOFT_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  trackingTitle: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "700",
  },
  trackingButton: {
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: GREEN,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  trackingButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  trackingMetrics: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SOFT_GREEN,
    borderRadius: 12,
    padding: 12,
  },
  trackingMetric: {
    flex: 1,
    alignItems: "center",
  },
  trackingMetricValue: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
  },
  trackingMetricLabel: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  trackingDivider: {
    width: 1,
    height: 32,
    backgroundColor: BORDER,
  },
  dailySummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  dailySummaryText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: "700",
  },
  actionsRow: {
    gap: 10,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  actionCardPressed: {
    backgroundColor: SOFT_GREEN,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "700",
  },
  actionSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
  },
  errorTextInline: {
    color: "#dc2626",
    fontSize: 13,
    flex: 1,
  },
  rationList: {
    gap: 10,
  },
  rationCard: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  rationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rationIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: SOFT_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  rationInfo: {
    flex: 1,
  },
  rationName: {
    color: "#1f2937",
    fontSize: 15,
    fontWeight: "700",
  },
  rationMeta: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  rationMetrics: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SOFT_GREEN,
    borderRadius: 12,
    padding: 10,
  },
  rationMetric: {
    flex: 1,
    alignItems: "center",
  },
  rationMetricValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
  },
  rationMetricLabel: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  rationMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: BORDER,
  },
});