import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  listAlerts,
  resolveAlert,
  type IotAlert,
  type AlertType,
} from "../../services/iotAlertsService";
import {
  listFatteningAlerts,
  resolveFatteningAlert,
  type FatteningAlert,
} from "../../services/fatteningService";
import { useAuth } from "../../hooks/useAuth";

const GREEN = "#14532d";
const BORDER = "#E7E4DC";
const TEXT_MUTED = "#8A8A85";

type UnifiedAlert =
  | { kind: "iot"; data: IotAlert }
  | { kind: "fattening"; data: FatteningAlert };

const IOT_ALERT_LABELS: Record<AlertType, { label: string; icon: string }> = {
  HIGH_TEMPERATURE: { label: "Température élevée", icon: "🌡️" },
  INACTIVITY: { label: "Immobilité prolongée", icon: "🛌" },
  LOW_BATTERY: { label: "Batterie faible", icon: "🔋" },
  OUT_OF_ZONE: { label: "Sortie de zone", icon: "📍" },
};

const FATTENING_ALERT_LABELS: Record<FatteningAlert["type"], { label: string; icon: string }> = {
  LOW_GMQ: { label: "GMQ bas", icon: "📉" },
  WEIGHT_DEVIATION: { label: "Écart de poids", icon: "⚖️" },
};

function timeAgo(dateStr: string): string {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `Il y a ${diffH} h`;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const exploitationId = (user as any)?.exploitationId;

  const [alerts, setAlerts] = useState<UnifiedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!exploitationId) {
      setAlerts([]);
      setError("Aucune exploitation assignée à votre compte.");
      return;
    }
    setError(null);

    const [iotResult, fatteningResult] = await Promise.all([
      listAlerts({ exploitationId, resolved: false }),
      listFatteningAlerts({ exploitationId, resolved: false }),
    ]);

    const unified: UnifiedAlert[] = [];

    if (iotResult.success) {
      for (const a of iotResult.data) {
        unified.push({ kind: "iot", data: a });
      }
    } else {
      setError(iotResult.message);
    }

    if (fatteningResult.success) {
      for (const a of fatteningResult.alerts) {
        unified.push({ kind: "fattening", data: a });
      }
    } else {
      setError(fatteningResult.message);
    }

    unified.sort(
      (a, b) =>
        new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
    );

    setAlerts(unified);
  }, [exploitationId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAlerts().finally(() => setLoading(false));
    }, [fetchAlerts])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  }

  async function handleResolve(alert: UnifiedAlert) {
    setResolvingId(alert.data.id);
    const isIot = alert.kind === "iot";
    const result = isIot
      ? await resolveAlert(alert.data.id)
      : await resolveFatteningAlert(alert.data.id);
    setResolvingId(null);
    if (result.success) {
      setAlerts((prev) => prev.filter((a) => a.data.id !== alert.data.id));
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  const totalAlerts = alerts.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F4" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Alertes</Text>
          <Text style={styles.subtitle}>
            {totalAlerts} alerte{totalAlerts !== 1 ? "s" : ""} active
            {totalAlerts !== 1 ? "s" : ""}
          </Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={GREEN} />
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item) =>
              item.kind === "iot"
                ? `iot-${item.data.id}`
                : `fattening-${item.data.id}`
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={GREEN}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={40} color="#0F7A3C" />
                <Text style={styles.emptyTitle}>Aucune alerte active</Text>
                <Text style={styles.emptyBody}>Tout va bien pour le moment.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isIot = item.kind === "iot";
              const info = isIot
                ? IOT_ALERT_LABELS[item.data.type]
                : FATTENING_ALERT_LABELS[item.data.type];
              const isCritical = item.data.severity === "CRITICAL";

              return (
                <View
                  style={[
                    styles.card,
                    isCritical && styles.cardCritical,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>
                      {info?.icon ?? "⚠️"}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardType}>
                        {info?.label ?? item.data.type}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {isIot
                          ? [
                              (item.data as IotAlert).shield?.ssmIotNumber,
                              (item.data as IotAlert).animal
                                ? `· ${(item.data as IotAlert).animal.name}`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")
                          : `Lot #${(item.data as FatteningAlert).fatteningBatchId}`}
                        {" · "}
                        {timeAgo(item.data.createdAt)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor: isCritical ? "#FEF3F2" : "#FFFAEB",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          { color: isCritical ? "#B42318" : "#B7791F" },
                        ]}
                      >
                        {isCritical ? "Critique" : "Attention"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardMessage}>
                    {item.data.message}
                  </Text>

                  <Pressable
                    style={styles.resolveButton}
                    onPress={() => handleResolve(item)}
                    disabled={resolvingId === item.data.id}
                  >
                    {resolvingId === item.data.id ? (
                      <ActivityIndicator size="small" color={GREEN} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color={GREEN} />
                        <Text style={styles.resolveButtonText}>
                          Marquer comme résolu
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAF8F4" },
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#1A1A18" },
  subtitle: { fontSize: 12.5, color: TEXT_MUTED },
  error: { color: "#B42318", marginBottom: 8, fontSize: 13 },
  listContent: { paddingBottom: 40 },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 32,
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A18" },
  emptyBody: { fontSize: 13, color: TEXT_MUTED },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
  },
  cardCritical: { borderColor: "#FECDCA" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  cardIcon: { fontSize: 22 },
  cardType: { fontSize: 14, fontWeight: "700", color: "#1A1A18" },
  cardMeta: { fontSize: 11.5, color: TEXT_MUTED, marginTop: 2 },
  severityBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  severityText: { fontSize: 11, fontWeight: "700" },
  cardMessage: {
    fontSize: 13,
    color: "#3D3D3A",
    lineHeight: 18,
    marginBottom: 12,
  },
  resolveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#BEE3C8",
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingVertical: 10,
  },
  resolveButtonText: { fontSize: 13, fontWeight: "700", color: "#0F7A3C" },
});
