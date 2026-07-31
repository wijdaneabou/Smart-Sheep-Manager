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
import { Link, useFocusEffect } from "expo-router";
import { listAnimals, type Animal } from "../../../services/animalsService";
import { API_URL } from "../../../services/api";
import {
  BREEDS,
  getBreedInfo,
  getSexInfo,
  getHealthStatusInfo,
} from "../../../constants/breeds";
import { BackButton } from "../../../components/BackButton";

type FilterType = "TOUT" | "Sardi" | "Timahdite" | "D'man" | "Beni-Guil";

export default function HerdScreen() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("TOUT");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAnimals() {
    setError(null);
    const result = await listAnimals({ search: search || undefined, limit: 50 });
    if (result.success) {
      setAnimals(result.data);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAnimals().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchAnimals();
    setRefreshing(false);
  }

  const filteredAnimals = useMemo(() => {
    if (filter === "TOUT") return animals;
    return animals.filter((a: Animal) => a.breed === filter);
  }, [animals, filter]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.headerRow}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Mon Troupeau</Text>
            <Text style={styles.subtitle}>
              {filteredAnimals.length} animal
              {filteredAnimals.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par RFID ou nom..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => {
                setLoading(true);
                fetchAnimals().finally(() => setLoading(false));
              }}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          <FilterPill
            label={`Tous (${animals.length})`}
            active={filter === "TOUT"}
            onPress={() => setFilter("TOUT")}
          />
          {BREEDS.map((b: { id: FilterType; label: string }) => (
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
            data={filteredAnimals}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun animal trouvé.</Text>
            }
            renderItem={({ item }) => {
              const breedInfo = getBreedInfo(item.breed);
              const sexInfo = getSexInfo(item.sex);
              const healthInfo = getHealthStatusInfo(item.healthStatus);
              const photoUrl = item.photoUrl
                ? `${API_URL}${item.photoUrl}`
                : undefined;

              return (
                <Link
                  href={
                    {
                      pathname: "/herd/[id]/detail",
                      params: { id: String(item.id) },
                    } as any
                  }
                  asChild
                >
                  <Pressable style={styles.card}>
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
                        <Text style={styles.name}>{item.name || item.rfid}</Text>
                        <View
                          style={[
                            styles.healthBadge,
                            { backgroundColor: healthInfo.color + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.healthBadgeText,
                              { color: healthInfo.color },
                            ]}
                          >
                            {healthInfo.icon} {healthInfo.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>▲</Text>
                        <Text style={styles.infoValue}>{breedInfo.label}</Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>{sexInfo.icon}</Text>
                        <Text style={styles.infoValue}>{sexInfo.label}</Text>
                      </View>

                      {item.weight ? (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoIcon}>⚖</Text>
                          <Text style={styles.infoValue}>{item.weight} kg</Text>
                        </View>
                      ) : null}

                      {item.bcs ? (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoIcon}>◐</Text>
                          <Text style={styles.infoValue}>BCS {item.bcs}</Text>
                        </View>
                      ) : null}

                      {item.birthDate ? (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoIcon}>📅</Text>
                          <Text style={styles.infoValue}>
                            {new Date(item.birthDate).toLocaleDateString("fr-FR")}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                </Link>
              );
            }}
          />
        )}

        <Link href={"/herd/create" as any} asChild>
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

  // --- New header with back button ---
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
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeText: { fontSize: 11, fontWeight: "700" },

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