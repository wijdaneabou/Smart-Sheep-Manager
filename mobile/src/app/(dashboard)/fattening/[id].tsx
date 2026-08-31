import { useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import {
  getFatteningBatchById,
  deleteFatteningBatch,
  getBatchGmqStats,
  listFatteningAlerts,
  resolveFatteningAlert,
  listBatchWeightRecords,
  listIndividualWeights,
  listFeedRecords,
  listBatchCosts,
  type FatteningBatch,
  type GmqStats,
  type FatteningAlert,
  type FatteningBatchWeightRecord,
  type FatteningBatchIndividualWeight,
  type FatteningFeedRecord,
  type FatteningBatchCostRecord,
} from "../../../services/fatteningService";
import { getAnimalById } from "../../../services/animalsService";
import { usePermissions } from "@/contexts/PermissionsContext";
import SubTabBar from "@/components/SubTabBar";

// 🎨 Palette unifiée — cohérente avec l'écran de liste des lots
const GREEN = "#0F7A3C";
const GREEN_DARK = "#0B4A24";
const GREEN_SOFT_BG = "#DCFCE7";
const GREEN_SOFT_TEXT = "#15803D";
const BLUE_SOFT_BG = "#DBEAFE";
const BLUE_SOFT_TEXT = "#1D4ED8";
const RED = "#DC2626";
const RED_SOFT_BG = "#FEE2E2";
const RED_SOFT_TEXT = "#991B1B";
const AMBER = "#D97706";
const AMBER_SOFT_BG = "#FEF3C7";
const PURPLE = "#7C3AED";
const PURPLE_SOFT_BG = "#F5F3FF";
const BLUE = "#2563EB";
const BLUE_SOFT_BG_2 = "#EFF6FF";
const BORDER = "#f0f0f0";
const BG = "#f5f5f5";
const INK = "#111827";
const MUTED = "#6B7280";

type TabKey = "overview" | "weighings" | "individual" | "feed" | "costs" | "alerts";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Vue d'ensemble" },
  { key: "weighings", label: "Pesées" },
  { key: "individual", label: "Poids ind." },
  { key: "feed", label: "Alimentation" },
  { key: "costs", label: "Coûts" },
  { key: "alerts", label: "Alertes" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: "En cours", color: GREEN_SOFT_TEXT, bgColor: GREEN_SOFT_BG },
  COMPLETED: { label: "Terminé", color: BLUE_SOFT_TEXT, bgColor: BLUE_SOFT_BG },
  CANCELLED: { label: "Annulé", color: RED, bgColor: RED_SOFT_BG },
};

export default function FatteningBatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const batchId = Number(id);

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [batch, setBatch] = useState<FatteningBatch | null>(null);
  const [gmqStats, setGmqStats] = useState<GmqStats | null>(null);
  const [alerts, setAlerts] = useState<FatteningAlert[]>([]);
  const [records, setRecords] = useState<FatteningBatchWeightRecord[]>([]);
  const [individualWeights, setIndividualWeights] = useState<FatteningBatchIndividualWeight[]>([]);
  const [feedRecords, setFeedRecords] = useState<FatteningFeedRecord[]>([]);
  const [costs, setCosts] = useState<FatteningBatchCostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // RFID cache: animalId -> rfid
  const [animalRfids, setAnimalRfids] = useState<Record<number, string>>({});
  const [rfidLookupFailed, setRfidLookupFailed] = useState<Set<number>>(new Set());
  const fetchedAnimalIdsRef = useRef<Set<number>>(new Set());

  const loadBatch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const result = await getFatteningBatchById(Number(id));
    if (result.success) {
      setBatch(result.batch);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, [id]);

  const loadGmqStats = useCallback(async () => {
    if (!id) return;
    const result = await getBatchGmqStats(Number(id));
    if (result.success) {
      setGmqStats(result.stats);
    }
  }, [id]);

  const loadAlerts = useCallback(async () => {
    if (!id) return;
    setLoadingAlerts(true);
    const result = await listFatteningAlerts({ fatteningBatchId: Number(id), resolved: false });
    if (result.success) {
      setAlerts(result.alerts);
    }
    setLoadingAlerts(false);
  }, [id]);

  const loadRecords = useCallback(async () => {
    if (!id) return;
    const result = await listBatchWeightRecords(Number(id));
    if (result.success) {
      setRecords(result.records);
    }
  }, [id]);

  const loadAnimalRfids = useCallback(async (weights: FatteningBatchIndividualWeight[]) => {
    const idsToFetch = Array.from(
      new Set(
        weights
          .map((w) => w.animalId)
          .filter((aid): aid is number => aid !== null && !fetchedAnimalIdsRef.current.has(aid))
      )
    );

    if (idsToFetch.length === 0) return;

    const results = await Promise.all(idsToFetch.map((aid) => getAnimalById(aid)));

    const updates: Record<number, string> = {};
    const failed: number[] = [];

    results.forEach((result, idx) => {
      const aid = idsToFetch[idx];
      if (result.success) {
        updates[aid] = result.animal.rfid;
        fetchedAnimalIdsRef.current.add(aid);
      } else {
        failed.push(aid);
        console.warn(`RFID introuvable pour l'animal #${aid}:`, result.message);
      }
    });

    if (Object.keys(updates).length > 0) {
      setAnimalRfids((prev) => ({ ...prev, ...updates }));
    }
    if (failed.length > 0) {
      setRfidLookupFailed((prev) => new Set([...prev, ...failed]));
    }
  }, []);

  const loadIndividualWeights = useCallback(async () => {
    if (!id) return;
    const result = await listIndividualWeights(Number(id));
    if (result.success) {
      setIndividualWeights(result.records);
      loadAnimalRfids(result.records);
    }
  }, [id, loadAnimalRfids]);

  const loadFeedRecords = useCallback(async () => {
    if (!id) return;
    const result = await listFeedRecords(Number(id));
    if (result.success) {
      setFeedRecords(result.records);
    }
  }, [id]);

  const loadCosts = useCallback(async () => {
    if (!id) return;
    const result = await listBatchCosts(Number(id));
    if (result.success) {
      setCosts(result.costs);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadBatch();
      loadGmqStats();
      loadAlerts();
      loadRecords();
      loadIndividualWeights();
      loadFeedRecords();
      loadCosts();
    }, [loadBatch, loadGmqStats, loadAlerts, loadRecords, loadIndividualWeights, loadFeedRecords, loadCosts])
  );

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      loadBatch(),
      loadGmqStats(),
      loadAlerts(),
      loadRecords(),
      loadIndividualWeights(),
      loadFeedRecords(),
      loadCosts(),
    ]);
    setRefreshing(false);
  }

  async function handleDelete() {
    if (!id || !batch) return;
    Alert.alert(
      "Supprimer le lot",
      `Êtes-vous sûr de vouloir supprimer le lot "${batch.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await deleteFatteningBatch(Number(id));
            if (result.success) {
              router.back();
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  async function handleResolveAlert(alertId: number) {
    const result = await resolveFatteningAlert(alertId);
    if (result.success) {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Détail du lot</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !batch) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Détail du lot</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centerContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={28} color={RED} />
          </View>
          <Text style={styles.errorText}>{error || "Lot introuvable."}</Text>
          <Pressable style={styles.retryButton} onPress={loadBatch}>
            <Text style={styles.retryButtonText}>RÉESSAYER</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = STATUS_CONFIG[batch.status] || STATUS_CONFIG.ACTIVE;
  const avgGain = batch.targetWeight && batch.initialAverageWeight
    ? (Number(batch.targetWeight) - Number(batch.initialAverageWeight)).toFixed(2)
    : "—";

  const overallGmqG = gmqStats?.history.overallGmq !== null && gmqStats?.history.overallGmq !== undefined && gmqStats
    ? (gmqStats.history.overallGmq * 1000).toFixed(0)
    : null;

  const totalFeedKg = feedRecords.reduce((sum, r) => sum + Number(r.quantityKg), 0);
  const totalFeedCost = feedRecords.reduce((sum, r) => sum + Number(r.totalCost), 0);
  const totalCosts = costs.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{batch.name}</Text>
            <Text style={styles.headerSubtitle}>Détail du lot</Text>
          </View>
          <View style={[styles.statusBadgeSmall, { backgroundColor: statusInfo.bgColor }]}>
            <Text style={[styles.statusBadgeSmallText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <SubTabBar
          tabs={TABS}
          activeKey={activeTab}
          onTabPress={(key) => setActiveTab(key as TabKey)}
        />

        {activeTab === "overview" && (
          <View>
            <View style={styles.statsGrid}>
              <StatBox icon="paw-outline" iconLib="ion" label="Animaux" value={String(batch.animalCount)} />
              <StatBox icon="scale-balance" iconLib="mci" label="Poids initial" value={`${Number(batch.initialAverageWeight).toFixed(2)} kg`} />
              <StatBox icon="flag-outline" iconLib="ion" label="Poids cible" value={`${Number(batch.targetWeight).toFixed(2)} kg`} />
              <StatBox icon="trending-up" iconLib="ion" label="Gain visé" value={`+${avgGain} kg`} />
            </View>

            <View style={styles.section}>
              <SectionTitle index={1} label="Actions rapides" />
              <View style={styles.actionsGrid}>
                <ActionCard
                  icon="analytics"
                  iconBg="#ECFDF5"
                  iconColor={GREEN}
                  label="Performance"
                  onPress={() => router.push("/fattening/performance" as any)}
                />
                <ActionCard
                  icon="nutrition"
                  iconBg={AMBER_SOFT_BG}
                  iconColor={AMBER}
                  label="Alimentation"
                  onPress={() => setActiveTab("feed")}
                />
                <ActionCard
                  icon="cash"
                  iconBg={BLUE_SOFT_BG_2}
                  iconColor={BLUE}
                  label="Coûts"
                  onPress={() => setActiveTab("costs")}
                />
                <ActionCard
                  icon="barbell"
                  iconBg={PURPLE_SOFT_BG}
                  iconColor={PURPLE}
                  label="Poids ind."
                  onPress={() => setActiveTab("individual")}
                />
              </View>
            </View>

            <View style={styles.section}>
              <SectionTitle index={2} label="Dates" />
              <DetailRow icon="calendar-outline" label="Date de début" value={new Date(batch.startDate).toLocaleDateString("fr-FR")} />
              {batch.estimatedEndDate ? (
                <DetailRow icon="flag-outline" label="Date de fin prévue" value={new Date(batch.estimatedEndDate).toLocaleDateString("fr-FR")} />
              ) : null}
              <DetailRow icon="time-outline" label="Créé le" value={new Date(batch.createdAt).toLocaleDateString("fr-FR")} isLast />
            </View>

            {batch.notes ? (
              <View style={styles.section}>
                <SectionTitle index={3} label="Notes" />
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{batch.notes}</Text>
                </View>
              </View>
            ) : null}

            {hasPermission("FATTENING", "UPDATE") && (
              <Pressable
                style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
                onPress={() => router.push(`/fattening/${batch.id}/edit` as any)}
              >
                <Feather name="edit-2" size={17} color="#fff" />
                <Text style={styles.editButtonText}>Modifier le lot</Text>
              </Pressable>
            )}

            {hasPermission("FATTENING", "DELETE") && (
              <Pressable
                style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
                onPress={handleDelete}
              >
                <Feather name="trash-2" size={17} color={RED} />
                <Text style={styles.deleteButtonText}>Supprimer le lot</Text>
              </Pressable>
            )}
          </View>
        )}

        {activeTab === "weighings" && (
          <View>
            {gmqStats && gmqStats.history.totalRecords > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Suivi GMQ</Text>
                  <Pressable
                    style={styles.linkButton}
                    onPress={() => router.push(`/fattening/${batchId}/weighing-history` as any)}
                  >
                    <Text style={styles.linkButtonText}>Voir tout</Text>
                    <Ionicons name="chevron-forward" size={14} color={GREEN} />
                  </Pressable>
                </View>
                <View style={styles.gmqGrid}>
                  <View style={styles.gmqBox}>
                    <Text style={styles.gmqLabel}>GMQ global</Text>
                    <Text style={styles.gmqValue}>
                      {overallGmqG ? `${overallGmqG} g/j` : "—"}
                    </Text>
                  </View>
                  <View style={styles.gmqBox}>
                    <Text style={styles.gmqLabel}>Pesées</Text>
                    <Text style={styles.gmqValue}>{gmqStats.history.totalRecords}</Text>
                  </View>
                  <View style={styles.gmqBox}>
                    <Text style={styles.gmqLabel}>Début</Text>
                    <Text style={styles.gmqValue}>
                      {gmqStats.history.firstWeight !== null
                        ? `${gmqStats.history.firstWeight.toFixed(2)} kg`
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.gmqBox}>
                    <Text style={styles.gmqLabel}>Fin</Text>
                    <Text style={styles.gmqValue}>
                      {gmqStats.history.lastWeight !== null
                        ? `${gmqStats.history.lastWeight.toFixed(2)} kg`
                        : "—"}
                    </Text>
                  </View>
                </View>
                <View style={styles.recentHistory}>
                  <Text style={styles.recentHistoryTitle}>Dernières pesées</Text>
                  {records.slice(0, 5).map((point) => (
                    <View key={point.id} style={styles.gmqHistoryRow}>
                      <Text style={styles.gmqHistoryDate}>{new Date(point.date).toLocaleDateString("fr-FR")}</Text>
                      <Text style={styles.gmqHistoryWeight}>{Number(point.averageWeight).toFixed(2)} kg</Text>
                      <Text style={styles.gmqHistoryGmq}>
                        {point.note ? point.note : "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <EmptyCard icon="analytics-outline" text="Aucune pesée enregistrée" subtext="Ajoutez une pesée pour suivre le GMQ." />
            )}
            {hasPermission("FATTENING", "CREATE") && (
              <Pressable
                style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
                onPress={() => router.push(`/fattening/${batchId}/add-weighing` as any)}
              >
                <Feather name="plus" size={17} color="#fff" />
                <Text style={styles.addButtonText}>Nouvelle pesée</Text>
              </Pressable>
            )}
          </View>
        )}

        {activeTab === "individual" && (
          <View>
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Poids individuels</Text>
                <Pressable
                  style={styles.linkButton}
                  onPress={() => router.push(`/fattening/${batchId}/individual-weights` as any)}
                >
                  <Text style={styles.linkButtonText}>Gérer</Text>
                  <Ionicons name="chevron-forward" size={14} color={GREEN} />
                </Pressable>
              </View>
              {individualWeights.length > 0 ? (
                <View>
                  <View style={styles.miniStatsGrid}>
                    <View style={styles.miniStatBox}>
                      <Text style={styles.miniStatValue}>{individualWeights.length}</Text>
                      <Text style={styles.miniStatLabel}>Enregistrements</Text>
                    </View>
                    <View style={styles.miniStatBox}>
                      <Text style={styles.miniStatValue}>
                        {(individualWeights.reduce((s, w) => s + Number(w.weight), 0) / individualWeights.length).toFixed(2)} kg
                      </Text>
                      <Text style={styles.miniStatLabel}>Moyenne</Text>
                    </View>
                  </View>
                  <View style={styles.recentHistory}>
                    {individualWeights.slice(0, 5).map((w) => (
                      <View key={w.id} style={styles.gmqHistoryRow}>
                        <Text style={styles.gmqHistoryDate}>{new Date(w.date).toLocaleDateString("fr-FR")}</Text>
                        <Text style={styles.gmqHistoryWeight}>{Number(w.weight).toFixed(2)} kg</Text>
                        <Text style={styles.gmqHistoryGmq}>
                          {w.animalId
                            ? animalRfids[w.animalId]
                              ? animalRfids[w.animalId]
                              : rfidLookupFailed.has(w.animalId)
                                ? "N/A"
                                : "…"
                            : "—"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <EmptyCard icon="barbell-outline" text="Aucun poids individuel" />
              )}
            </View>
          </View>
        )}

        {activeTab === "feed" && (
          <View>
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Alimentation</Text>
                <Pressable
                  style={styles.linkButton}
                  onPress={() => router.push(`/fattening/${batchId}/feed` as any)}
                >
                  <Text style={styles.linkButtonText}>Gérer</Text>
                  <Ionicons name="chevron-forward" size={14} color={GREEN} />
                </Pressable>
              </View>
              {feedRecords.length > 0 ? (
                <View>
                  <View style={styles.miniStatsGrid}>
                    <View style={styles.miniStatBox}>
                      <Text style={styles.miniStatValue}>{totalFeedKg.toFixed(1)} kg</Text>
                      <Text style={styles.miniStatLabel}>Total feed</Text>
                    </View>
                    <View style={styles.miniStatBox}>
                      <Text style={styles.miniStatValue}>{totalFeedCost.toFixed(2)} DH</Text>
                      <Text style={styles.miniStatLabel}>Coût total</Text>
                    </View>
                  </View>
                  <View style={styles.recentHistory}>
                    {feedRecords.slice(0, 5).map((r) => (
                      <View key={r.id} style={styles.gmqHistoryRow}>
                        <Text style={styles.gmqHistoryDate}>{new Date(r.date).toLocaleDateString("fr-FR")}</Text>
                        <Text style={styles.gmqHistoryWeight}>{r.feedType}</Text>
                        <Text style={styles.gmqHistoryGmq}>
                          {Number(r.quantityKg).toFixed(1)} kg — {(Number(r.quantityKg) * Number(r.unitPrice)).toFixed(2)} DH
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <EmptyCard icon="nutrition-outline" text="Aucun enregistrement alimentaire" />
              )}
            </View>
          </View>
        )}

        {activeTab === "costs" && (
          <View>
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Coûts</Text>
                <Pressable
                  style={styles.linkButton}
                  onPress={() => router.push(`/fattening/${batchId}/costs` as any)}
                >
                  <Text style={styles.linkButtonText}>Gérer</Text>
                  <Ionicons name="chevron-forward" size={14} color={GREEN} />
                </Pressable>
              </View>
              {costs.length > 0 ? (
                <View>
                  <View style={styles.miniStatsGrid}>
                    <View style={styles.miniStatBox}>
                      <Text style={styles.miniStatValue}>{totalCosts.toFixed(2)} DH</Text>
                      <Text style={styles.miniStatLabel}>Total coûts</Text>
                    </View>
                    <View style={styles.miniStatBox}>
                      <Text style={styles.miniStatValue}>{costs.length}</Text>
                      <Text style={styles.miniStatLabel}>Enregistrements</Text>
                    </View>
                  </View>
                  <View style={styles.recentHistory}>
                    {costs.slice(0, 5).map((c) => (
                      <View key={c.id} style={styles.gmqHistoryRow}>
                        <Text style={styles.gmqHistoryDate}>{new Date(c.date).toLocaleDateString("fr-FR")}</Text>
                        <Text style={styles.gmqHistoryWeight}>{c.category}</Text>
                        <Text style={styles.gmqHistoryGmq}>
                          {Number(c.amount).toFixed(2)} DH
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <EmptyCard icon="cash-outline" text="Aucun coût enregistré" />
              )}
            </View>
          </View>
        )}

        {activeTab === "alerts" && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alertes actives</Text>
              {loadingAlerts ? (
                <View style={styles.centerContainerSmall}>
                  <ActivityIndicator size="small" color={GREEN} />
                </View>
              ) : alerts.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  {alerts.map((alert) => (
                    <View key={alert.id} style={styles.alertRow}>
                      <View style={styles.alertIconWrap}>
                        <Ionicons
                          name={alert.type === "LOW_GMQ" ? "trending-down" : "scale-outline"}
                          size={16}
                          color={RED}
                        />
                      </View>
                      <View style={styles.alertContent}>
                        <Text style={styles.alertMessage}>{alert.message}</Text>
                        <Text style={styles.alertMeta}>
                          {alert.type === "LOW_GMQ" ? "GMQ faible" : "Écart poids"} · {alert.severity === "CRITICAL" ? "Critique" : "Avertissement"}
                        </Text>
                      </View>
                      {hasPermission("FATTENING", "UPDATE") && (
                        <Pressable
                          style={({ pressed }) => [styles.alertResolveButton, pressed && { opacity: 0.7 }]}
                          onPress={() => handleResolveAlert(alert.id)}
                          hitSlop={8}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyCard icon="checkmark-circle-outline" text="Aucune alerte active" />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({
  icon,
  iconLib,
  label,
  value,
}: {
  icon: string;
  iconLib: "ion" | "mci";
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statIconWrap}>
        {iconLib === "ion" ? (
          <Ionicons name={icon as any} size={18} color={GREEN} />
        ) : (
          <MaterialCommunityIcons name={icon as any} size={18} color={GREEN} />
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({
  icon,
  iconBg,
  iconColor,
  label,
  onPress,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.actionIconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function DetailRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon as any} size={16} color={MUTED} style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function SectionTitle({ index, label }: { index: number; label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>
        {index}. {label}
      </Text>
    </View>
  );
}

function EmptyCard({ icon, text, subtext }: { icon: string; text: string; subtext?: string }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name={icon as any} size={26} color="#bbb" style={{ marginBottom: 8 }} />
      <Text style={styles.emptyText}>{text}</Text>
      {subtext ? <Text style={styles.emptySubtext}>{subtext}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  container: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitleWrap: { flex: 1, marginLeft: 4 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: INK },
  headerSubtitle: { fontSize: 12, color: MUTED, marginTop: 1 },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeSmallText: { fontSize: 11, fontWeight: "700" },

  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  centerContainerSmall: { alignItems: "center", justifyContent: "center", paddingVertical: 20 },
  errorIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: RED_SOFT_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  errorText: { color: "#7F1D1D", fontSize: 14, fontWeight: "600", marginBottom: 16, textAlign: "center", paddingHorizontal: 24 },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GREEN_SOFT_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 15, fontWeight: "800", color: INK },
  statLabel: { fontSize: 11, color: MUTED, fontWeight: "600", marginTop: 2 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionBar: { width: 4, height: 14, backgroundColor: GREEN, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937" },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCard: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionCardPressed: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
  },

  gmqGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  gmqBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  gmqLabel: { fontSize: 11, color: MUTED, fontWeight: "600", marginBottom: 4 },
  gmqValue: { fontSize: 16, fontWeight: "800", color: INK },

  recentHistory: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  recentHistoryTitle: { fontSize: 12, fontWeight: "700", color: "#555", marginBottom: 8 },
  gmqHistoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  gmqHistoryDate: { flex: 1, fontSize: 13, color: "#444" },
  gmqHistoryWeight: { flex: 1, fontSize: 13, fontWeight: "700", color: INK, textAlign: "center" },
  gmqHistoryGmq: { flex: 1, fontSize: 13, fontWeight: "600", color: GREEN_SOFT_TEXT, textAlign: "right" },

  miniStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  miniStatBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  miniStatValue: { fontSize: 16, fontWeight: "800", color: GREEN },
  miniStatLabel: { fontSize: 11, color: MUTED, fontWeight: "600", marginTop: 2 },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  detailIcon: { width: 26 },
  detailLabel: { fontSize: 13, fontWeight: "600", color: "#555", width: 140 },
  detailValue: { fontSize: 14, fontWeight: "700", color: INK, flex: 1 },
  notesBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 14,
  },
  notesText: { fontSize: 14, color: "#333", lineHeight: 20 },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 8,
  },
  editButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: RED_SOFT_BG,
    paddingVertical: 13,
    gap: 8,
  },
  deleteButtonPressed: { backgroundColor: RED_SOFT_BG },
  deleteButtonText: { color: RED, fontWeight: "700", fontSize: 14 },
  buttonPressed: { opacity: 0.85 },

  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: RED,
  },
  alertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RED_SOFT_BG,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  alertContent: { flex: 1 },
  alertMessage: { fontSize: 13, fontWeight: "600", color: "#7F1D1D", lineHeight: 18 },
  alertMeta: { fontSize: 11, color: RED_SOFT_TEXT, fontWeight: "500", marginTop: 2 },
  alertResolveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#666" },
  emptySubtext: { fontSize: 13, color: "#999", marginTop: 4 },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  linkButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: GREEN,
  },
});