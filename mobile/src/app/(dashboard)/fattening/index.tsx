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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  listFatteningBatches,
  deleteFatteningBatch,
  type FatteningBatch,
  type FatteningStatus,
} from "../../../services/fatteningService";
import { BackButton } from "../../../components/BackButton";
import Pagination from "@/components/Pagination";
import { usePermissions } from "@/contexts/PermissionsContext";

type FilterStatus = "ALL" | FatteningStatus;

const STATUS_CONFIG: Record<FatteningStatus, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: "En cours", color: "#15803D", bgColor: "#DCFCE7" },
  COMPLETED: { label: "Terminé", color: "#1D4ED8", bgColor: "#DBEAFE" },
  CANCELLED: { label: "Annulé", color: "#DC2626", bgColor: "#FEE2E2" },
};

const PAGE_SIZE = 20;
const GREEN = "#0F7A3C";

export default function FatteningScreen() {
  const router = useRouter();
  const [batches, setBatches] = useState<FatteningBatch[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { hasPermission } = usePermissions();

  // 🔐 Permission checks
  const canCreate = hasPermission("FATTENING", "CREATE");
  const canEdit = hasPermission("FATTENING", "UPDATE");
  const canDelete = hasPermission("FATTENING", "DELETE");

  async function fetchBatches(pageNum = 1) {
    setError(null);
    const result = await listFatteningBatches({
      search: search || undefined,
      status: filter === "ALL" ? undefined : filter,
      page: pageNum,
      limit: PAGE_SIZE,
    });
    if (result.success) {
      setBatches(result.data);
      const total = result.pagination?.total ?? 0;
      const limit = result.pagination?.limit ?? PAGE_SIZE;
      setTotalPages(Math.max(1, Math.ceil(total / limit)));
      setPage(pageNum);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBatches(1).finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchBatches(page);
    setRefreshing(false);
  }

  const filteredBatches = useMemo(() => {
    if (filter === "ALL") return batches;
    return batches.filter((b: FatteningBatch) => b.status === filter);
  }, [batches, filter]);

  function handleFilterChange(newFilter: FilterStatus) {
    setFilter(newFilter);
    setPage(1);
  }

  // 🗑️ Delete handler
  async function handleDeleteBatch(batch: FatteningBatch) {
    if (!canDelete) return;
    Alert.alert(
      "Supprimer le lot",
      `Voulez-vous vraiment supprimer le lot "${batch.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await deleteFatteningBatch(batch.id);
            if (result.success) {
              setBatches((prev) => prev.filter((b) => b.id !== batch.id));
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  function renderBatchItem({ item }: { item: FatteningBatch }) {
    const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.ACTIVE;
    const avgGain = item.targetWeight && item.initialAverageWeight
      ? (Number(item.targetWeight) - Number(item.initialAverageWeight)).toFixed(2)
      : "—";

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/fattening/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.bgColor },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Animaux</Text>
            <Text style={styles.statValue}>{item.animalCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Poids initial</Text>
            <Text style={styles.statValue}>{Number(item.initialAverageWeight).toFixed(2)} kg</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Poids cible</Text>
            <Text style={styles.statValue}>{Number(item.targetWeight).toFixed(2)} kg</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoValue}>
            Début: {new Date(item.startDate).toLocaleDateString("fr-FR")}
          </Text>
        </View>

        {item.estimatedEndDate ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏁</Text>
            <Text style={styles.infoValue}>
              Fin prévue: {new Date(item.estimatedEndDate).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📈</Text>
          <Text style={styles.infoValue}>Gain visé: +{avgGain} kg / animal</Text>
        </View>

        {item.notes ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📝</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.notes}
            </Text>
          </View>
        ) : null}

        {/* 🔐 Action buttons – only show if user has permission */}
        <View style={styles.actionRow}>
          {canEdit && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/fattening/${item.id}/edit`);
              }}
            >
              <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
              <Text style={[styles.actionText, { color: "#3B82F6" }]}>Modifier</Text>
            </Pressable>
          )}
          {canDelete && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteBatch(item);
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.actionText, { color: "#EF4444" }]}>Supprimer</Text>
            </Pressable>
          )}
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Lots d’engraissement</Text>
            <Text style={styles.subtitle}>
              {filteredBatches.length} lot{filteredBatches.length > 1 ? "s" : ""}
            </Text>
          </View>
          <Link href={"/fattening/performance" as any} asChild>
            <Pressable style={styles.perfButton} hitSlop={12}>
              <Ionicons name="bar-chart-outline" size={20} color={GREEN} />
            </Pressable>
          </Link>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryPill, { backgroundColor: "#DCFCE7" }]}>
            <Text style={[styles.summaryPillText, { color: "#15803D" }]}>
              {batches.filter(b => b.status === "ACTIVE").length} en cours
            </Text>
          </View>
          <View style={[styles.summaryPill, { backgroundColor: "#DBEAFE" }]}>
            <Text style={[styles.summaryPillText, { color: "#1D4ED8" }]}>
              {batches.filter(b => b.status === "COMPLETED").length} terminés
            </Text>
          </View>
          <View style={[styles.summaryPill, { backgroundColor: "#FEE2E2" }]}>
            <Text style={[styles.summaryPillText, { color: "#DC2626" }]}>
              {batches.filter(b => b.status === "CANCELLED").length} annulés
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => {
                setLoading(true);
                fetchBatches(1).finally(() => setLoading(false));
              }}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          <FilterPill
            label="Tous"
            active={filter === "ALL"}
            onPress={() => handleFilterChange("ALL")}
          />
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <FilterPill
              key={key}
              label={config.label}
              active={filter === key}
              onPress={() => handleFilterChange(key as FilterStatus)}
            />
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={filteredBatches}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun lot d’engraissement trouvé.</Text>
            }
            renderItem={renderBatchItem}
          />
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => fetchBatches(page - 1)}
          onNext={() => fetchBatches(page + 1)}
        />

        {/* 🔐 Show FAB only if user can create */}
        {canCreate && (
          <Link href={"/fattening/create" as any} asChild>
            <Pressable style={styles.fab}>
              <Text style={styles.fabIcon}>+</Text>
            </Pressable>
          </Link>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  backButton: { marginRight: 8 },
  perfButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: "800", color: "#111" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 2 },

  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  summaryPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

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
  listContent: { paddingBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { marginBottom: 12 },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: { fontSize: 17, fontWeight: "800", color: GREEN, flex: 1, marginRight: 8 },
  idText: { fontSize: 11, color: "#999", fontWeight: "600" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 10,
  },
  statBox: { alignItems: "center", flex: 1 },
  statLabel: { fontSize: 11, color: "#666", fontWeight: "600", marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: "800", color: "#111" },
  infoRow: { flexDirection: "row", alignItems: "center", minHeight: 18, marginTop: 4 },
  infoIcon: { fontSize: 14, width: 24, color: "#666" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#333", flex: 1 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  actionButtonPressed: { opacity: 0.7 },
  actionText: { fontSize: 12, fontWeight: "600", marginLeft: 4 },
  chevron: { fontSize: 24, color: "#ccc", marginLeft: "auto" },
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