import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  listIotShields,
  type IotShield,
  type SensorType,
  type ShieldStatus,
} from "../../../services/iotShieldsService";
import { SENSOR_TYPES, getSensorTypeInfo, getShieldStatusInfo } from "../../../constants/iot";
import { BackButton } from "../../../components/BackButton";

type FilterType = "TOUT" | SensorType;
type StatusFilterType = "TOUT" | ShieldStatus;

const SEARCH_DEBOUNCE_MS = 400;

export default function IoTShieldScreen() {
  const [shields, setShields] = useState<IotShield[]>([]);
  const [search, setSearch] = useState("");
  const [sensorFilter, setSensorFilter] = useState<FilterType>("TOUT");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("TOUT");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Garde une référence "vivante" des filtres pour que fetchShields()
  // utilise toujours les valeurs les plus récentes, même appelée depuis
  // un callback capturé plus tôt (ex: useFocusEffect).
  const filtersRef = useRef({ search, sensorFilter, statusFilter });
  filtersRef.current = { search, sensorFilter, statusFilter };

  // Pour ignorer les réponses obsolètes si l'utilisateur change vite les filtres
  const requestIdRef = useRef(0);

  async function fetchShields() {
    const { search, sensorFilter, statusFilter } = filtersRef.current;
    const requestId = ++requestIdRef.current;

    setError(null);
    const result = await listIotShields({
      search: search || undefined,
      sensorType: sensorFilter === "TOUT" ? undefined : sensorFilter,
      status: statusFilter === "TOUT" ? undefined : statusFilter,
      limit: 50,
    });

    // Une requête plus récente est déjà partie/arrivée : on ignore ce résultat périmé
    if (requestId !== requestIdRef.current) return;

    if (result.success) {
      setShields(result.data);
    } else {
      setError(result.message);
    }
  }

  // Premier chargement + rechargement à chaque retour sur l'écran
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchShields().finally(() => setLoading(false));
    }, [])
  );

  // ── Relance la recherche automatiquement quand les filtres changent ──
  // (on saute le tout premier rendu, déjà couvert par useFocusEffect ci-dessus)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLoading(true);
    fetchShields().finally(() => setLoading(false));
  }, [sensorFilter, statusFilter]);

  // ── Recherche texte debouncée : on attend que l'utilisateur arrête de taper ──
  useEffect(() => {
    if (isFirstRender.current) return; // déjà géré par le focus effect initial
    const timeout = setTimeout(() => {
      setLoading(true);
      fetchShields().finally(() => setLoading(false));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchShields();
    setRefreshing(false);
  }

  const activeCount = shields.filter((s) => s.status === "ACTIVE").length;
  const inactiveCount = shields.filter((s) => s.status === "INACTIVE").length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Boucliers IoT</Text>
            <Text style={styles.subtitle}>
              {shields.length} bouclier{shields.length > 1 ? "s" : ""}
              {activeCount > 0 ? ` • ${activeCount} actif${activeCount > 1 ? "s" : ""}` : ""}
            </Text>
          </View>
        </View>

        {/* Real-time tracking link */}
        <Link href={"/iot/live" as any} asChild>
          <Pressable style={styles.liveButton}>
            <Text style={styles.liveButtonIcon}>📡</Text>
            <Text style={styles.liveButtonText}>Suivi en temps réel</Text>
          </Pressable>
        </Link>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par numéro SSM-IOT ou animal..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => {
                setLoading(true);
                fetchShields().finally(() => setLoading(false));
              }}
            />
            {search.length > 0 && (
              <Pressable
                onPress={() => setSearch("")}
                hitSlop={8}
                accessibilityLabel="Effacer la recherche"
              >
                <Ionicons name="close-circle" size={18} color="#bbb" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Sensor Type Filter */}
        <View style={styles.filterRow}>
          <FilterPill
            label="Tous les capteurs"
            active={sensorFilter === "TOUT"}
            onPress={() => setSensorFilter("TOUT")}
          />
          {SENSOR_TYPES.map((s) => (
            <FilterPill
              key={s.id}
              label={s.label}
              active={sensorFilter === s.id}
              onPress={() => setSensorFilter(s.id)}
            />
          ))}
        </View>

        {/* Status Filter */}
        <View style={styles.filterRow}>
          <FilterPill
            label={`Tous (${shields.length})`}
            active={statusFilter === "TOUT"}
            onPress={() => setStatusFilter("TOUT")}
          />
          <FilterPill
            label={`Actifs (${activeCount})`}
            active={statusFilter === "ACTIVE"}
            onPress={() => setStatusFilter("ACTIVE")}
          />
          <FilterPill
            label={`Inactifs (${inactiveCount})`}
            active={statusFilter === "INACTIVE"}
            onPress={() => setStatusFilter("INACTIVE")}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={shields}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun bouclier IoT trouvé.</Text>
            }
            renderItem={({ item }) => {
              const sensorInfo = getSensorTypeInfo(item.sensorType);
              const statusInfo = getShieldStatusInfo(item.status);
              const batteryNum = parseFloat(item.battery);
              const batteryColor =
                batteryNum > 50
                  ? "#16a34a"
                  : batteryNum > 20
                  ? "#f59e0b"
                  : "#dc2626";

              return (
                <Link
                  href={
                    {
                      pathname: "/iot/[id]/detail",
                      params: { id: String(item.id) },
                    } as any
                  }
                  asChild
                >
                  <Pressable style={styles.card}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardIconText}>{sensorInfo.icon}</Text>
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.ssmNumber}>{item.ssmIotNumber}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: statusInfo.color + "20" },
                          ]}
                        >
                          <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                            {statusInfo.icon} {statusInfo.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📡</Text>
                        <Text style={styles.infoValue}>{sensorInfo.label}</Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>🔋</Text>
                        <Text style={[styles.infoValue, { color: batteryColor }]}>
                          {item.battery}%
                        </Text>
                      </View>

                      {item.animal ? (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoIcon}>🐑</Text>
                          <Text style={styles.infoValue}>
                            {item.animal.name} ({item.animal.rfid})
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoIcon}>🐑</Text>
                          <Text style={[styles.infoValue, { color: "#999" }]}>
                            Aucun animal associé
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                </Link>
              );
            }}
          />
        )}

        <Link href={"/iot/create" as any} asChild>
          <Pressable style={styles.fab}>
            <Text style={styles.fabIcon}>+</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterPill, active && styles.filterPillActive]}
    >
      <Text
        style={[styles.filterPillText, active && styles.filterPillTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const GREEN = "#0F7A3C";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, paddingHorizontal: 16 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },

  title: { fontSize: 22, fontWeight: "800", color: "#111" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 2 },

  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 14 },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  filterPillActive: { backgroundColor: "#DCFCE7", borderColor: GREEN },
  filterPillText: { fontSize: 13, fontWeight: "600", color: "#555" },
  filterPillTextActive: { color: GREEN },

  error: { color: "#dc2626", marginBottom: 8, fontSize: 13 },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
  listContent: { paddingBottom: 100 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardIconText: { fontSize: 28 },

  cardBody: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  ssmNumber: { fontSize: 16, fontWeight: "800", color: GREEN },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },

  infoRow: { flexDirection: "row", alignItems: "center", minHeight: 18 },
  infoIcon: { fontSize: 12, width: 20, color: "#666" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#333" },

  chevron: { fontSize: 24, color: "#ccc", marginLeft: 6 },

  fab: {
    position: "absolute",
    right: 4,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#0B4A24",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  liveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  liveButtonIcon: { fontSize: 20 },
  liveButtonText: { fontSize: 15, fontWeight: "700", color: "#059669" },

  fabIcon: { fontSize: 28, color: "#fff", fontWeight: "300", marginTop: -2 },
});