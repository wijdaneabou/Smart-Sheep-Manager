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
  listFrameworkContracts,
  deleteFrameworkContract,
  type FrameworkContract,
  type ContractStatus,
} from "../../../../services/frameworkContractsService";
import { BackButton } from "../../../../components/BackButton";
import Pagination from "@/components/Pagination";
import { usePermissions } from "@/contexts/PermissionsContext";

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bgColor: string }> = {
  EN_NEGOCIATION: { label: "En négociation", color: "#D97706", bgColor: "#FEF3C7" },
  ACTIF: { label: "Actif", color: "#15803D", bgColor: "#DCFCE7" },
  EXPIRE: { label: "Expiré", color: "#DC2626", bgColor: "#FEE2E2" },
  RESILIE: { label: "Résilié", color: "#666", bgColor: "#F3F4F6" },
};

const PAGE_SIZE = 20;
const GREEN = "#0F7A3C";

export default function FrameworkContractsScreen() {
  const router = useRouter();
  const [contractsList, setContracts] = useState<FrameworkContract[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContractStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("FRAMEWORK_CONTRACTS", "CREATE");
  const canEdit = hasPermission("FRAMEWORK_CONTRACTS", "UPDATE");
  const canDelete = hasPermission("FRAMEWORK_CONTRACTS", "DELETE");

  async function fetchContracts(pageNum = 1) {
    setError(null);
    const result = await listFrameworkContracts({
      search: search || undefined,
      status: filter === "ALL" ? undefined : filter,
      page: pageNum,
      limit: PAGE_SIZE,
    });
    if (result.success) {
      setContracts(result.data);
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
      fetchContracts(1).finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchContracts(page);
    setRefreshing(false);
  }

  const filteredContracts = useMemo(() => {
    if (filter === "ALL") return contractsList;
    return contractsList.filter((c: FrameworkContract) => c.status === filter);
  }, [contractsList, filter]);

  function handleFilterChange(newFilter: ContractStatus | "ALL") {
    setFilter(newFilter);
    setPage(1);
  }

  async function handleDeleteContract(contract: FrameworkContract) {
    if (!canDelete) return;
    Alert.alert(
      "Supprimer le contrat",
      `Voulez-vous vraiment supprimer le contrat "${contract.contractNumber}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await deleteFrameworkContract(contract.id);
            if (result.success) {
              setContracts((prev) => prev.filter((c) => c.id !== contract.id));
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  function renderContractItem({ item }: { item: FrameworkContract }) {
    const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.EN_NEGOCIATION;

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/commercial/framework-contracts/${item.id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.contractNumber}
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

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👤</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.clientName}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.startDate} → {item.endDate}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>💰</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.negotiatedPrice} | Mensuel: {item.monthlyVolume} | Annuel: {item.yearlyVolume}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {canEdit && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/commercial/framework-contracts/${item.id}/edit` as any);
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
                handleDeleteContract(item);
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
            <Text style={styles.title}>Contrats Cadres</Text>
            <Text style={styles.subtitle}>
              {filteredContracts.length} contrat{filteredContracts.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par numéro..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => {
                setLoading(true);
                fetchContracts(1).finally(() => setLoading(false));
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
              onPress={() => handleFilterChange(key as ContractStatus)}
            />
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={filteredContracts}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun contrat trouvé.</Text>
            }
            renderItem={renderContractItem}
          />
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => fetchContracts(page - 1)}
          onNext={() => fetchContracts(page + 1)}
        />

        {canCreate && (
          <Link href={"/commercial/framework-contracts/create" as any} asChild>
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
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: "800", color: "#111" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 2 },

  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
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
  cardHeader: { marginBottom: 10 },
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
