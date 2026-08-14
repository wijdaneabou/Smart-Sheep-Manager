import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";

import {
  getFatteningBatchById,
  deleteFatteningBatch,
  getBatchGmqStats,
  listFatteningAlerts,
  resolveFatteningAlert,
  type FatteningBatch,
  type GmqStats,
  type FatteningAlert,
} from "../../../services/fatteningService";
import { usePermissions } from "@/contexts/PermissionsContext";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: "En cours", color: "#15803D", bgColor: "#DCFCE7" },
  COMPLETED: { label: "Terminé", color: "#1D4ED8", bgColor: "#DBEAFE" },
  CANCELLED: { label: "Annulé", color: "#DC2626", bgColor: "#FEE2E2" },
};

const GMQ_TARGET_MIN = 0.18;
const GMQ_TARGET_MAX = 0.25;

function getGmqStatus(gmq: number | null): { label: string; color: string; bgColor: string } {
  if (gmq === null) return { label: "N/A", color: "#666", bgColor: "#f0f0f0" };
  if (gmq < GMQ_TARGET_MIN) return { label: "Bas", color: "#DC2626", bgColor: "#FEE2E2" };
  if (gmq > GMQ_TARGET_MAX) return { label: "Élevé", color: "#D97706", bgColor: "#FEF3C7" };
  return { label: "Objectif", color: "#15803D", bgColor: "#DCFCE7" };
}

export default function FatteningBatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasPermission } = usePermissions();

  const [batch, setBatch] = useState<FatteningBatch | null>(null);
  const [gmqStats, setGmqStats] = useState<GmqStats | null>(null);
  const [alerts, setAlerts] = useState<FatteningAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGmq, setLoadingGmq] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setLoadingGmq(true);
    const result = await getBatchGmqStats(Number(id));
    if (result.success) {
      setGmqStats(result.stats);
    }
    setLoadingGmq(false);
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

  useEffect(() => {
    Promise.resolve().then(() => {
      loadBatch();
      loadGmqStats();
      loadAlerts();
    });
  }, [id, loadBatch, loadGmqStats, loadAlerts]);

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
            <Ionicons name="arrow-back" size={22} color="#14532d" />
          </Pressable>
          <Text style={styles.headerTitle}>Détail du lot</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#15803D" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !batch) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#14532d" />
          </Pressable>
          <Text style={styles.headerTitle}>Détail du lot</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centerContainer}>
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
  const avgDailyGmqG = gmqStats?.history.averageDailyGmq !== null && gmqStats?.history.averageDailyGmq !== undefined && gmqStats
    ? (gmqStats.history.averageDailyGmq * 1000).toFixed(0)
    : null;
  const gmqStatus = overallGmqG && gmqStats ? getGmqStatus(gmqStats.history.overallGmq) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#14532d" />
          </Pressable>
          <Text style={styles.headerTitle}>Détail du lot</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{batch.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          <Text style={styles.idText}>Lot #{batch.id}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatBox icon="🐑" label="Animaux" value={String(batch.animalCount)} />
          <StatBox icon="⚖️" label="Poids initial" value={`${Number(batch.initialAverageWeight).toFixed(2)} kg`} />
          <StatBox icon="🎯" label="Poids cible" value={`${Number(batch.targetWeight).toFixed(2)} kg`} />
          <StatBox icon="📈" label="Gain visé" value={`+${avgGain} kg`} />
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
              iconBg="#FEF3C7"
              iconColor="#D97706"
              label="Alimentation"
              onPress={() => router.push(`/fattening/${batch.id}/feed` as any)}
            />
            <ActionCard
              icon="cash"
              iconBg="#EFF6FF"
              iconColor="#2563EB"
              label="Coûts"
              onPress={() => router.push(`/fattening/${batch.id}/costs` as any)}
            />
            <ActionCard
              icon="barbell"
              iconBg="#F5F3FF"
              iconColor="#7C3AED"
              label="Poids ind."
              onPress={() => router.push(`/fattening/${batch.id}/individual-weights` as any)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle index={2} label="Suivi GMQ" />
          {loadingGmq ? (
            <View style={styles.gmqLoading}>
              <ActivityIndicator size="small" color="#15803D" />
            </View>
          ) : gmqStats && gmqStats.history.totalRecords > 0 ? (
            <View>
              <View style={styles.gmqGrid}>
                <View style={styles.gmqBox}>
                  <Text style={styles.gmqLabel}>GMQ global</Text>
                  <Text style={styles.gmqValue}>
                    {overallGmqG ? `${overallGmqG} g/j` : "—"}
                  </Text>
                  {gmqStatus && (
                    <View style={[styles.gmqBadge, { backgroundColor: gmqStatus.bgColor }]}>
                      <Text style={[styles.gmqBadgeText, { color: gmqStatus.color }]}>
                        {gmqStatus.label}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.gmqBox}>
                  <Text style={styles.gmqLabel}>GMQ moyen</Text>
                  <Text style={styles.gmqValue}>
                    {avgDailyGmqG ? `${avgDailyGmqG} g/j` : "—"}
                  </Text>
                  <Text style={styles.gmqTarget}>Cible : 180-250 g/j</Text>
                </View>
                <View style={styles.gmqBox}>
                  <Text style={styles.gmqLabel}>Pesées</Text>
                  <Text style={styles.gmqValue}>{gmqStats.history.totalRecords}</Text>
                  <Text style={styles.gmqTarget}>
                    {gmqStats.history.firstWeight !== null && gmqStats.history.lastWeight !== null
                      ? `${gmqStats.history.firstWeight.toFixed(2)} → ${gmqStats.history.lastWeight.toFixed(2)} kg`
                      : "—"}
                  </Text>
                </View>
                <View style={styles.gmqBox}>
                  <Text style={styles.gmqLabel}>Jours écoulés</Text>
                  <Text style={styles.gmqValue}>{Math.floor(gmqStats.daysElapsed)}</Text>
                  {gmqStats.projectedFinalWeight !== null && (
                    <Text style={styles.gmqTarget}>
                      Proj. : {gmqStats.projectedFinalWeight.toFixed(2)} kg
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.gmqHistory}>
                <Text style={styles.gmqHistoryTitle}>Historique des pesées</Text>
                {gmqStats.history.dataPoints.map((point) => (
                  <View key={point.id} style={styles.gmqHistoryRow}>
                    <Text style={styles.gmqHistoryDate}>{point.dateStr}</Text>
                    <Text style={styles.gmqHistoryWeight}>{point.weight.toFixed(2)} kg</Text>
                    <Text style={styles.gmqHistoryGmq}>
                      {point.dailyGmq !== null
                        ? `${(point.dailyGmq * 1000).toFixed(0)} g/j`
                        : "—"}
                    </Text>
                  </View>
                ))}
              </View>

              {hasPermission("FATTENING", "UPDATE") && (
                <Pressable
                  style={styles.addWeighingButton}
                  onPress={() => router.push(`/fattening/${batch.id}/add-weighing` as any)}
                >
                  <Feather name="plus" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.addWeighingButtonText}>NOUVELLE PESÉE</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.gmqEmpty}>
              <Text style={styles.gmqEmptyText}>Aucune pesée enregistrée</Text>
              <Text style={styles.gmqEmptySubtext}>
                Ajoutez une pesée pour suivre le GMQ du lot.
              </Text>
              {hasPermission("FATTENING", "UPDATE") && (
                <Pressable
                  style={styles.addWeighingButton}
                  onPress={() => router.push(`/fattening/${batch.id}/add-weighing` as any)}
                >
                  <Feather name="plus" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.addWeighingButtonText}>AJOUTER UNE PESÉE</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle index={3} label="Alertes" />
          {loadingAlerts ? (
            <View style={styles.alertLoading}>
              <ActivityIndicator size="small" color="#15803D" />
            </View>
          ) : alerts.length > 0 ? (
            <View>
              {alerts.map((alert) => (
                <View key={alert.id} style={styles.alertRow}>
                  <View style={styles.alertIconWrap}>
                    <Text style={styles.alertIcon}>
                      {alert.type === "LOW_GMQ" ? "📉" : "⚖️"}
                    </Text>
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertMeta}>
                      {alert.type === "LOW_GMQ" ? "GMQ faible" : "Écart poids"} · {alert.severity === "CRITICAL" ? "Critique" : "Avertissement"}
                    </Text>
                  </View>
                  {hasPermission("FATTENING", "UPDATE") && (
                    <Pressable
                      style={styles.alertResolveButton}
                      onPress={() => handleResolveAlert(alert.id)}
                    >
                      <Text style={styles.alertResolveText}>✓</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.alertEmpty}>
              <Text style={styles.alertEmptyText}>Aucune alerte active</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle index={4} label="Dates" />
          <DetailRow icon="📅" label="Date de début" value={new Date(batch.startDate).toLocaleDateString("fr-FR")} />
          {batch.estimatedEndDate ? (
            <DetailRow icon="🏁" label="Date de fin prévue" value={new Date(batch.estimatedEndDate).toLocaleDateString("fr-FR")} />
          ) : null}
          <DetailRow icon="🕐" label="Créé le" value={new Date(batch.createdAt).toLocaleDateString("fr-FR")} />
        </View>

        {batch.notes ? (
          <View style={styles.section}>
            <SectionTitle index={5} label="Notes" />
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{batch.notes}</Text>
            </View>
          </View>
        ) : null}

        {hasPermission("FATTENING", "UPDATE") && (
          <Pressable
            style={styles.editButton}
            onPress={() => router.push(`/fattening/${batch.id}/edit` as any)}
          >
            <Feather name="edit" size={18} color="#fff" />
            <Text style={styles.editButtonText}>MODIFIER</Text>
          </Pressable>
        )}

        {hasPermission("FATTENING", "DELETE") && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Feather name="trash-2" size={18} color="#fff" />
            <Text style={styles.deleteButtonText}>SUPPRIMER</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statIcon}>{icon}</Text>
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

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
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

const GREEN = "#14532d";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#dc2626", fontSize: 15, marginBottom: 16, textAlign: "center" },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
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
  name: { fontSize: 20, fontWeight: "800", color: GREEN, flex: 1, marginRight: 12 },
  idText: { fontSize: 12, color: "#999", fontWeight: "600" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },

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
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: "800", color: "#111" },
  statLabel: { fontSize: 11, color: "#666", fontWeight: "600", marginTop: 2 },

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
    borderColor: "#f0f0f0",
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
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionBar: { width: 4, height: 14, backgroundColor: GREEN, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937" },

  gmqLoading: { paddingVertical: 16, alignItems: "center" },
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
  gmqLabel: { fontSize: 11, color: "#666", fontWeight: "600", marginBottom: 4 },
  gmqValue: { fontSize: 16, fontWeight: "800", color: "#111" },
  gmqBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  gmqBadgeText: { fontSize: 11, fontWeight: "700" },
  gmqTarget: { fontSize: 10, color: "#888", fontWeight: "500", marginTop: 4 },

  gmqHistory: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  gmqHistoryTitle: { fontSize: 12, fontWeight: "700", color: "#555", marginBottom: 8 },
  gmqHistoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  gmqHistoryDate: { flex: 1, fontSize: 13, color: "#444" },
  gmqHistoryWeight: { flex: 1, fontSize: 13, fontWeight: "700", color: "#111", textAlign: "center" },
  gmqHistoryGmq: { flex: 1, fontSize: 13, fontWeight: "600", color: "#15803D", textAlign: "right" },

  gmqEmpty: { alignItems: "center", paddingVertical: 20 },
  gmqEmptyText: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 4 },
  gmqEmptySubtext: { fontSize: 13, color: "#999", marginBottom: 14 },

  addWeighingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  addWeighingButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailIcon: { fontSize: 16, width: 28, color: "#666" },
  detailLabel: { fontSize: 13, fontWeight: "600", color: "#555", width: 140 },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#111", flex: 1 },
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
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  deleteButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  alertLoading: { paddingVertical: 16, alignItems: "center" },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  alertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  alertIcon: { fontSize: 16 },
  alertContent: { flex: 1 },
  alertMessage: { fontSize: 13, fontWeight: "600", color: "#7F1D1D", lineHeight: 18 },
  alertMeta: { fontSize: 11, color: "#991B1B", fontWeight: "500", marginTop: 2 },
  alertResolveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  alertResolveText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  alertEmpty: { alignItems: "center", paddingVertical: 16 },
  alertEmptyText: { fontSize: 13, fontWeight: "600", color: "#999" },
});
