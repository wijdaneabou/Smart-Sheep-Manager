import { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  listAlerts,
  resolveAlert,
  type IotAlert,
  type AlertType,
} from "../../../services/iotAlertsService";
import { BackButton } from "../../../components/BackButton";
import { usePermissions } from "../../../contexts/PermissionsContext";

const GREEN = "#14532d";
const BORDER = "#E7E4DC";
const TEXT_MUTED = "#8A8A85";

const ALERT_LABELS: Record<AlertType, { label: string; icon: string }> = {
  HIGH_TEMPERATURE: { label: "Température élevée", icon: "🌡️" },
  INACTIVITY: { label: "Immobilité prolongée", icon: "🛌" },
  LOW_BATTERY: { label: "Batterie faible", icon: "🔋" },
  OUT_OF_ZONE: { label: "Sortie de zone", icon: "📍" },
};

function timeAgo(dateStr: string): string {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `Il y a ${diffH} h`;
}

export default function IotAlertsScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Silent redirect if no read permission
  useEffect(() => {
    if (!hasPermission('IOT', 'ALERTS:READ')) {
      router.replace("/iot");
    }
  }, [hasPermission, router]);

  const [alerts, setAlerts] = useState<IotAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  async function fetchAlerts() {
    setError(null);
    const result = await listAlerts({ resolved: false });
    if (result.success) {
      setAlerts(result.data);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAlerts().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  }

  async function handleResolve(alert: IotAlert) {
    setResolvingId(alert.id);
    const result = await resolveAlert(alert.id);
    setResolvingId(null);
    if (result.success) {
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  const canResolve = hasPermission('IOT', 'ALERTS:UPDATE');

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Alertes</Text>
            <Text style={styles.subtitle}>
              {alerts.length} alerte{alerts.length !== 1 ? "s" : ""} active
              {alerts.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={GREEN} />
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={40} color="#0F7A3C" />
                <Text style={styles.emptyTitle}>Aucune alerte active</Text>
                <Text style={styles.emptyBody}>Tout va bien pour le moment.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const info = ALERT_LABELS[item.type];
              const isCritical = item.severity === "CRITICAL";

              return (
                <View style={[styles.card, isCritical && styles.cardCritical]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>{info?.icon ?? "⚠️"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardType}>{info?.label ?? item.type}</Text>
                      <Text style={styles.cardMeta}>
                        {item.shield?.ssmIotNumber}
                        {item.animal ? ` · ${item.animal.name}` : ""} ·{" "}
                        {timeAgo(item.createdAt)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.severityBadge,
                        { backgroundColor: isCritical ? "#FEF3F2" : "#FFFAEB" },
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

                  <Text style={styles.cardMessage}>{item.message}</Text>

                  {canResolve && (
                    <Pressable
                      style={styles.resolveButton}
                      onPress={() => handleResolve(item)}
                      disabled={resolvingId === item.id}
                    >
                      {resolvingId === item.id ? (
                        <ActivityIndicator size="small" color={GREEN} />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color={GREEN} />
                          <Text style={styles.resolveButtonText}>Marquer comme résolu</Text>
                        </>
                      )}
                    </Pressable>
                  )}
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

  header: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 16 },
  backButton: { marginRight: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#1A1A18" },
  subtitle: { fontSize: 12.5, color: TEXT_MUTED, marginTop: 2 },

  error: { color: "#B42318", marginBottom: 8, fontSize: 13 },
  listContent: { paddingBottom: 40 },

  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 32, gap: 6 },
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

  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  cardIcon: { fontSize: 22 },
  cardType: { fontSize: 14, fontWeight: "700", color: "#1A1A18" },
  cardMeta: { fontSize: 11.5, color: TEXT_MUTED, marginTop: 2 },

  severityBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  severityText: { fontSize: 11, fontWeight: "700" },

  cardMessage: { fontSize: 13, color: "#3D3D3A", lineHeight: 18, marginBottom: 12 },

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