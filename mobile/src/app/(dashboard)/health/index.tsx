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
import { useFocusEffect, useRouter } from "expo-router";
import api, { API_URL } from "../../../services/api";
import { BackButton } from "../../../components/BackButton";
import { getBreedInfo, getSexInfo } from "../../../constants/breeds";

type HealthStatus = 'HEALTHY' | 'SURVEILLANCE' | 'SICK' | 'UNDER_TREATMENT' | 'RECOVERED';

const statusConfig: Record<HealthStatus, { label: string; color: string; icon: string }> = {
  HEALTHY:        { label: 'Sain',          color: '#10B981', icon: '✅' },
  SURVEILLANCE:   { label: 'Surveillance',  color: '#F59E0B', icon: '👀' },
  SICK:           { label: 'Malade',        color: '#EF4444', icon: '🤒' },
  UNDER_TREATMENT:{ label: 'En traitement', color: '#F97316', icon: '💊' },
  RECOVERED:      { label: 'Rétabli',       color: '#3B82F6', icon: '💪' },
};

const statusFilterTypes = ["TOUT", "HEALTHY", "SURVEILLANCE", "SICK", "UNDER_TREATMENT", "RECOVERED"] as const;
type StatusFilter = typeof statusFilterTypes[number];

export default function HealthRecordsList() {
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("TOUT");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRecords() {
    setError(null);
    try {
      const response = await api.get('/health/records');
      setRecords(response.data.data);
    } catch (err) {
      setError("Erreur de chargement des dossiers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRecords();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  }

  const filteredRecords = useMemo(() => {
    let result = records;
    if (filter !== "TOUT") {
      result = result.filter((r) => r.status === filter);
    }
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.diagnosis?.toLowerCase().includes(query) ||
          r.animalName?.toLowerCase().includes(query) ||
          r.animalRfid?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [records, search, filter]);

  const getStatusInfo = (status: string) => {
    return statusConfig[status as HealthStatus] || { label: status, color: '#6B7280', icon: '❓' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ActivityIndicator style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.headerRow}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Dossiers médicaux</Text>
            <Text style={styles.subtitle}>
              {filteredRecords.length} dossier{filteredRecords.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par diagnostic ou animal..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          {statusFilterTypes.map((type) => {
            const label =
              type === "TOUT"
                ? `Tous (${records.length})`
                : statusConfig[type as HealthStatus]?.label || type;
            return (
              <FilterPill
                key={type}
                label={label}
                active={filter === type}
                onPress={() => setFilter(type)}
              />
            );
          })}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun dossier trouvé.</Text>
          }
          renderItem={({ item }) => {
            const statusInfo = getStatusInfo(item.status);
            const photoUrl = item.animalPhotoUrl
              ? `${API_URL}${item.animalPhotoUrl}`
              : undefined;
            
            // Récupération des infos de race et sexe
            const breedInfo = item.breed ? getBreedInfo(item.breed) : null;
            const sexInfo = item.sex ? getSexInfo(item.sex) : null;

            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/health/${item.id}/detail`)}
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Text style={styles.thumbFallbackIcon}>
                      {breedInfo?.icon || '🐑'}
                    </Text>
                  </View>
                )}

                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.name}>
                      {item.animalName || `Animal #${item.animalId}`}
                    </Text>
                    <View
                      style={[
                        styles.healthBadge,
                        { backgroundColor: statusInfo.color + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.healthBadgeText,
                          { color: statusInfo.color },
                        ]}
                      >
                        {statusInfo.icon} {statusInfo.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.rfid}>{item.animalRfid}</Text>

                  {/* Race et sexe */}
                  <View style={styles.infoRow}>
                    {breedInfo && (
                      <>
                        <Text style={styles.infoIcon}>🐑</Text>
                        <Text style={styles.infoValue}>{breedInfo.label}</Text>
                        <Text style={styles.separator}>·</Text>
                      </>
                    )}
                    {sexInfo && (
                      <>
                        <Text style={styles.infoIcon}>{sexInfo.icon}</Text>
                        <Text style={styles.infoValue}>{sexInfo.label}</Text>
                      </>
                    )}
                  </View>

                  {/* Poids et BCS si disponibles */}
                  {(item.weight || item.bcs) && (
                    <View style={styles.infoRow}>
                      {item.weight && (
                        <>
                          <Text style={styles.infoIcon}>⚖</Text>
                          <Text style={styles.infoValue}>{item.weight} kg</Text>
                        </>
                      )}
                      {item.weight && item.bcs && <Text style={styles.separator}>·</Text>}
                      {item.bcs && (
                        <>
                          <Text style={styles.infoIcon}>◐</Text>
                          <Text style={styles.infoValue}>BCS {item.bcs}</Text>
                        </>
                      )}
                    </View>
                  )}

                  {item.diagnosis && (
                    <Text style={styles.diagnosis} numberOfLines={1}>
                      {item.diagnosis}
                    </Text>
                  )}

                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📅</Text>
                    <Text style={styles.infoValue}>
                      {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                </View>

                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          }}
        />

        {/* Boutons flottants : + et Rapport */}
        <View style={styles.fabContainer}>
          <Pressable
            style={styles.fab}
            onPress={() => router.push("/health/create")}
          >
            <Text style={styles.fabIcon}>+</Text>
          </Pressable>

          <Pressable
            style={styles.rapportFab}
            onPress={() => router.push("/health/report" as any)}
          >
            <Text style={styles.rapportFabText}>📊 Rapport</Text>
          </Pressable>
        </View>
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

  // --- Header ---
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  backButton: { marginRight: 8 },
  headerTitleContainer: { flex: 1 },

  title: { fontSize: 26, fontWeight: "800", color: "#111" },
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
  rfid: { fontSize: 12, color: "#888", marginBottom: 2 },
  diagnosis: { fontSize: 14, color: "#333", marginBottom: 2 },
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeText: { fontSize: 11, fontWeight: "700" },

  infoRow: { flexDirection: "row", alignItems: "center", minHeight: 18, flexWrap: "wrap" },
  infoIcon: { fontSize: 12, width: 20, color: "#666" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#333" },
  separator: { fontSize: 13, color: "#ccc", marginHorizontal: 4 },

  chevron: { fontSize: 24, color: "#ccc", marginLeft: 6 },

  fabContainer: {
    position: "absolute",
    right: 4,
    bottom: 16,
    alignItems: "center",
    gap: 8,
  },
  fab: {
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

  rapportFab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#0B4A24",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  rapportFabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});