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

// 🎨 Palette unifiée — cohérente avec les écrans de création/modification
const GREEN = "#14532d";
const GREEN_DARK = "#0B3A1F";
const BG = "#faf6f1";
const CARD_BG = "#fff";
const BORDER = "#ECECE6";
const SOFT_GREEN = "#f5f5f0";
const GREEN_SOFT_BG = "#DCFCE7";
const GREEN_SOFT_TEXT = "#15803D";
const BLUE_SOFT_BG = "#DBEAFE";
const BLUE_SOFT_TEXT = "#1D4ED8";
const RED = "#DC2626";
const RED_SOFT_BG = "#FEE2E2";
const RED_SOFT_TEXT = "#DC2626";
const BLUE_ACTION = "#3B82F6";
const MUTED = "#888";

const STATUS_CONFIG: Record<FatteningStatus, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: "En cours", color: GREEN_SOFT_TEXT, bgColor: GREEN_SOFT_BG },
  COMPLETED: { label: "Terminé", color: BLUE_SOFT_TEXT, bgColor: BLUE_SOFT_BG },
  CANCELLED: { label: "Annulé", color: RED, bgColor: RED_SOFT_BG },
};

const PAGE_SIZE = 20;

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
          <Ionicons name="calendar-outline" size={14} color={MUTED} style={styles.infoIcon} />
          <Text style={styles.infoValue}>
            Début: {new Date(item.startDate).toLocaleDateString("fr-FR")}
          </Text>
        </View>

        {item.estimatedEndDate ? (
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={14} color={MUTED} style={styles.infoIcon} />
            <Text style={styles.infoValue}>
              Fin prévue: {new Date(item.estimatedEndDate).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Ionicons name="trending-up-outline" size={14} color={MUTED} style={styles.infoIcon} />
          <Text style={styles.infoValue}>Gain visé: +{avgGain} kg / animal</Text>
        </View>

        {item.notes ? (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={14} color={MUTED} style={styles.infoIcon} />
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
              <Ionicons name="pencil-outline" size={18} color={BLUE_ACTION} />
              <Text style={[styles.actionText, { color: BLUE_ACTION }]}>Modifier</Text>
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
              <Ionicons name="trash-outline" size={18} color={RED_SOFT_TEXT} />
              <Text style={[styles.actionText, { color: RED_SOFT_TEXT }]}>Supprimer</Text>
            </Pressable>
          )}
          <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.chevron} />
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
            <Text style={styles.title}>Lots d'engraissement</Text>
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
          <View style={[styles.summaryPill, { backgroundColor: GREEN_SOFT_BG }]}>
            <Text style={[styles.summaryPillText, { color: GREEN_SOFT_TEXT }]}>
              {batches.filter(b => b.status === "ACTIVE").length} en cours
            </Text>
          </View>
          <View style={[styles.summaryPill, { backgroundColor: BLUE_SOFT_BG }]}>
            <Text style={[styles.summaryPillText, { color: BLUE_SOFT_TEXT }]}>
              {batches.filter(b => b.status === "COMPLETED").length} terminés
            </Text>
          </View>
          <View style={[styles.summaryPill, { backgroundColor: RED_SOFT_BG }]}>
            <Text style={[styles.summaryPillText, { color: RED }]}>
              {batches.filter(b => b.status === "CANCELLED").length} annulés
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={16} color="#999" style={styles.searchIcon} />
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

        {/* 🔴 Bannière d'erreur cohérente avec les écrans de formulaire */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={RED} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={GREEN} />
        ) : (
          <FlatList
            data={filteredBatches}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="leaf-outline" size={32} color="#bbb" />
                <Text style={styles.empty}>Aucun lot d'engraissement trouvé.</Text>
              </View>
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
              <Ionicons name="add" size={28} color="#fff" />
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
  safeArea: { flex: 1, backgroundColor: BG },
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
    backgroundColor: CARD_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: "800", color: "#111" },
  subtitle: { fontSize: 13, color: MUTED, marginTop: 2 },

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
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 14 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterPillActive: { backgroundColor: GREEN_SOFT_BG, borderColor: GREEN },
  filterPillText: { fontSize: 13, fontWeight: "600", color: "#555" },
  filterPillTextActive: { color: GREEN },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: RED_SOFT_BG,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  errorText: { color: RED, fontSize: 13, fontWeight: "600", flex: 1 },

  emptyState: { alignItems: "center", marginTop: 40, gap: 8 },
  empty: { textAlign: "center", color: MUTED },
  listContent: { paddingBottom: 20 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: { marginBottom: 12 },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: { fontSize: 17, fontWeight: "800", color: GREEN, flex: 1, marginRight: 8 },
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
    backgroundColor: SOFT_GREEN,
    borderRadius: 12,
    padding: 10,
  },
  statBox: { alignItems: "center", flex: 1 },
  statLabel: { fontSize: 11, color: "#666", fontWeight: "600", marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: "800", color: "#111" },
  infoRow: { flexDirection: "row", alignItems: "center", minHeight: 18, marginTop: 4 },
  infoIcon: { width: 24 },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#333", flex: 1 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
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
  chevron: { marginLeft: "auto" },
  fab: {
    position: "absolute",
    right: 4,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: GREEN_DARK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});