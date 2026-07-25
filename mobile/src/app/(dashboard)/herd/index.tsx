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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useFocusEffect } from "expo-router";
import {
  listAnimals,
  type Animal,
} from "../../../services/animalsService";
import { BREEDS, SEXES, HEALTH_STATUSES, getBreedInfo, getSexInfo, getHealthStatusInfo } from "../../../constants/breeds";

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
    return animals.filter((a) => a.breed === filter);
  }, [animals, filter]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Gestion du troupeau</Text>
            <Text style={styles.subtitle}>
              {filteredAnimals.length} animal
              {filteredAnimals.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

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

        <View style={styles.filterRow}>
          <FilterPill
            label="Tout"
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
            data={filteredAnimals}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun animal trouvé.</Text>
            }
            ListFooterComponent={
              <Link href={"/herd/create" as any} asChild>
                <Pressable style={styles.addCard}>
                  <View style={styles.addIconCircle}>
                    <Text style={styles.addIcon}>+</Text>
                  </View>
                  <Text style={styles.addCardText}>Ajouter un animal</Text>
                </Pressable>
              </Link>
            }
            renderItem={({ item }) => {
              const breedInfo = getBreedInfo(item.breed);
              const sexInfo = getSexInfo(item.sex);
              const healthInfo = getHealthStatusInfo(item.healthStatus);

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
                    <View style={styles.cardHeader}>
                      <Text style={styles.animalIcon}>{breedInfo.icon}</Text>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.name}>{item.name}</Text>
                        <View
                          style={[
                            styles.healthBadge,
                            { backgroundColor: healthInfo.color + "20" },
                          ]}
                        >
                          <Text style={styles.healthBadgeText}>
                            {healthInfo.icon} {healthInfo.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>RFID</Text>
                        <Text style={styles.infoValue}>{item.rfid}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Race</Text>
                        <Text style={styles.infoValue}>{breedInfo.label}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Sexe</Text>
                        <Text style={styles.infoValue}>
                          {sexInfo.icon} {sexInfo.label}
                        </Text>
                      </View>
                      {item.weight && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Poids</Text>
                          <Text style={styles.infoValue}>{item.weight} kg</Text>
                        </View>
                      )}
                      {item.bcs && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>BCS</Text>
                          <Text style={styles.infoValue}>{item.bcs}</Text>
                        </View>
                      )}
                      {item.birthDate && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Né(e)</Text>
                          <Text style={styles.infoValue}>
                            {new Date(item.birthDate).toLocaleDateString("fr-FR")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Link>
              );
            }}
          />
        )}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { marginTop: 8, marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "700", color: "#0F2A1D" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
    fontSize: 14,
  },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  filterPillActive: { backgroundColor: "#059669", borderColor: "#059669" },
  filterPillText: { fontSize: 12, fontWeight: "600", color: "#555" },
  filterPillTextActive: { color: "#fff" },
  error: { color: "#dc2626", marginBottom: 8, fontSize: 13 },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
  listContent: { paddingBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  animalIcon: { fontSize: 32, marginRight: 12 },
  cardTitleRow: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "700", color: "#0F2A1D" },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeText: { fontSize: 10, fontWeight: "600", color: "#333" },
  cardBody: { padding: 14 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 12, color: "#888" },
  infoValue: { fontSize: 12, fontWeight: "600", color: "#333" },
  addCard: {
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  addIcon: { fontSize: 22, color: "#059669", fontWeight: "300" },
  addCardText: { fontSize: 14, fontWeight: "600", color: "#059669" },
});
