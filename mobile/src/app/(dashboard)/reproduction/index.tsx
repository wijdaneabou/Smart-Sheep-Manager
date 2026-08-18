import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { listAnimals, type Animal } from "../../../services/animalsService";
import { reproductionService, ReproductionCycle } from "../../../services/reproductionService";
import { API_URL } from "../../../services/api";
import { BackButton } from "../../../components/BackButton";
import { usePermissions } from "@/contexts/PermissionsContext"; // 👈 NEW IMPORT
import {
  BREEDS,
  getBreedInfo,
  getSexInfo,
  getHealthStatusInfo,
} from "../../../constants/breeds";

type FilterType = "TOUT" | "Sardi" | "Timahdite" | "D'man" | "Beni-Guil";

interface FemaleWithSummary {
  id: number;
  name: string;
  rfid: string;
  breed: string;
  sex: string;
  photoUrl?: string;
  cyclesCount: number;
  lastCycle: ReproductionCycle | null;
}

export default function ReproductionScreen() {
  const [females, setFemales] = useState<FemaleWithSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("TOUT");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { hasPermission } = usePermissions(); // 👈 NEW

  async function loadData() {
    setError(null);
    try {
      const result = await listAnimals({ sex: "FEMALE" });
      if (!result.success) {
        setError(result.message);
        setFemales([]);
        return;
      }
      const femaleList: Animal[] = result.data || [];

      const femalesWithSummary = await Promise.all(
        femaleList.map(async (animal) => {
          try {
            const resCycles = await reproductionService.getCyclesByAnimal(animal.id);
            const cycles = resCycles.data.data || [];
            const lastCycle = cycles.length > 0 ? cycles[0] : null;
            return {
              id: animal.id,
              name: animal.name,
              rfid: animal.rfid,
              breed: animal.breed,
              sex: animal.sex,
              photoUrl: animal.photoUrl || undefined,
              cyclesCount: cycles.length,
              lastCycle,
            };
          } catch {
            return {
              id: animal.id,
              name: animal.name,
              rfid: animal.rfid,
              breed: animal.breed,
              sex: animal.sex,
              photoUrl: animal.photoUrl || undefined,
              cyclesCount: 0,
              lastCycle: null,
            };
          }
        })
      );

      setFemales(femalesWithSummary);
    } catch (err) {
      setError("Impossible de charger les données.");
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const filteredFemales = useMemo(() => {
    let filtered = females;
    if (filter !== "TOUT") {
      filtered = filtered.filter((f) => f.breed === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (f) => f.name.toLowerCase().includes(q) || f.rfid.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [females, filter, search]);

  const getStatusIcon = (lastCycle: ReproductionCycle | null) => {
    if (!lastCycle) return "⚪";
    return lastCycle.pregnancyConfirmed ? "✅" : "⏳";
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.subtitle}>
              {filteredFemales.length} femelle{filteredFemales.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Recherche */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom ou RFID..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => {
                setLoading(true);
                loadData().finally(() => setLoading(false));
              }}
            />
          </View>
        </View>

        {/* Filtres par race */}
        <View style={styles.filterRow}>
          <FilterPill
            label={`Toutes (${females.length})`}
            active={filter === "TOUT"}
            onPress={() => setFilter("TOUT")}
          />
          {BREEDS.map((b) => (
            <FilterPill
              key={b.id}
              label={b.label}
              active={filter === b.id}
              onPress={() => setFilter(b.id)}
            />
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={filteredFemales}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Aucune femelle trouvée.</Text>
            }
            renderItem={({ item }) => {
              const breedInfo = getBreedInfo(item.breed);
              const sexInfo = getSexInfo(item.sex);
              const photoUrl = item.photoUrl
                ? `${API_URL}${item.photoUrl}`
                : undefined;

              return (
                <Pressable
                  style={styles.card}
                  onPress={() => router.push(`/reproduction/${item.id}`)}
                >
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.thumb} />
                  ) : (
                    <View style={styles.thumbFallback}>
                      <Text style={styles.thumbFallbackIcon}>
                        {breedInfo.icon}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.name}>{item.name}</Text>
                      <View style={styles.cycleBadge}>
                        <Text style={styles.cycleBadgeText}>
                          {item.cyclesCount} cycle{item.cyclesCount > 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>

                    {/* RFID */}
                    <View style={styles.infoRow}>
                      <Text style={styles.infoIcon}>🏷️</Text>
                      <Text style={styles.infoValue}>{item.rfid}</Text>
                    </View>

                    {/* Race */}
                    <View style={styles.infoRow}>
                      <Text style={styles.infoIcon}>🐑</Text>
                      <Text style={styles.infoValue}>{breedInfo.label}</Text>
                    </View>

                    {/* Sexe */}
                    <View style={styles.infoRow}>
                      <Text style={styles.infoIcon}>{sexInfo.icon}</Text>
                      <Text style={styles.infoValue}>{sexInfo.label}</Text>
                    </View>

                    {/* Dernier cycle */}
                    {item.lastCycle && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📅</Text>
                        <Text style={styles.infoValue}>
                          Dernier cycle :{" "}
                          {new Date(item.lastCycle.heatDate).toLocaleDateString("fr-FR")}
                          {" " + getStatusIcon(item.lastCycle)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              );
            }}
          />
        )}

        {/* 👇 FAB Ajouter cycle - REPRODUCTION:CREATE */}
        {hasPermission('REPRODUCTION', 'CREATE') && (
          <Pressable
            style={styles.fab}
            onPress={() => router.push("/reproduction/add")}
          >
            <Text style={styles.fabIcon}>+</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── FilterPill ──
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

// ── Styles ──
const GREEN = "#0F7A3C";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 8,
  },
  backButton: { marginRight: 8 },
  headerTitleContainer: { flex: 1 },

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

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
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
  empty: { textAlign: "center", color: "#888", marginTop: 4 },
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

  thumb: { width: 64, height: 64, borderRadius: 14, marginRight: 14 },
  thumbFallback: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbFallbackIcon: { fontSize: 30 },

  cardBody: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: { fontSize: 17, fontWeight: "800", color: GREEN },
  cycleBadge: {
    backgroundColor: "#E6F8ED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cycleBadgeText: { fontSize: 11, fontWeight: "700", color: GREEN },

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
  fabIcon: { fontSize: 28, color: "#fff", fontWeight: "300", marginTop: -2 },
});