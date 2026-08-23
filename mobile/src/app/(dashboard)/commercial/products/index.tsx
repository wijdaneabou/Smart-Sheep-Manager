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
  listProducts,
  deleteProduct,
  type Product,
  type ProductCategory,
  type ProductAvailability,
} from "../../../../services/productsService";
import { BackButton } from "../../../../components/BackButton";
import Pagination from "@/components/Pagination";
import { usePermissions } from "@/contexts/PermissionsContext";

const CATEGORY_CONFIG: Record<ProductCategory, { label: string; color: string; bgColor: string }> = {
  AGNEAUX: { label: "Agneaux", color: "#15803D", bgColor: "#DCFCE7" },
  MOUTONS: { label: "Moutons", color: "#1D4ED8", bgColor: "#DBEAFE" },
  LAINE: { label: "Laine", color: "#D97706", bgColor: "#FEF3C7" },
  VIANDE: { label: "Viande", color: "#DC2626", bgColor: "#FEE2E2" },
  AUTRE: { label: "Autre", color: "#7C3AED", bgColor: "#EDE9FE" },
};

const AVAILABILITY_CONFIG: Record<ProductAvailability, { label: string; color: string; bgColor: string }> = {
  DISPONIBLE: { label: "Disponible", color: "#15803D", bgColor: "#DCFCE7" },
  LIMITE: { label: "Limité", color: "#D97706", bgColor: "#FEF3C7" },
  RUPTURE: { label: "Rupture", color: "#DC2626", bgColor: "#FEE2E2" },
};

const PAGE_SIZE = 20;
const GREEN = "#0F7A3C";

export default function ProductsScreen() {
  const router = useRouter();
  const [productsList, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "ALL">("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<ProductAvailability | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("PRODUCTS", "CREATE");
  const canEdit = hasPermission("PRODUCTS", "UPDATE");
  const canDelete = hasPermission("PRODUCTS", "DELETE");

  async function fetchProducts(pageNum = 1) {
    setError(null);
    const result = await listProducts({
      search: search || undefined,
      category: categoryFilter === "ALL" ? undefined : categoryFilter,
      availability: availabilityFilter === "ALL" ? undefined : availabilityFilter,
      page: pageNum,
      limit: PAGE_SIZE,
    });
    if (result.success) {
      setProducts(result.data);
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
      fetchProducts(1).finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchProducts(page);
    setRefreshing(false);
  }

  const filteredProducts = useMemo(() => {
    if (categoryFilter === "ALL" && availabilityFilter === "ALL") return productsList;
    return productsList.filter((p: Product) => {
      if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false;
      if (availabilityFilter !== "ALL" && p.availability !== availabilityFilter) return false;
      return true;
    });
  }, [productsList, categoryFilter, availabilityFilter]);

  function handleCategoryChange(newFilter: ProductCategory | "ALL") {
    setCategoryFilter(newFilter);
    setPage(1);
  }

  function handleAvailabilityChange(newFilter: ProductAvailability | "ALL") {
    setAvailabilityFilter(newFilter);
    setPage(1);
  }

  async function handleDeleteProduct(product: Product) {
    if (!canDelete) return;
    Alert.alert(
      "Supprimer le produit",
      `Voulez-vous vraiment supprimer "${product.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await deleteProduct(product.id);
            if (result.success) {
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  function renderProductItem({ item }: { item: Product }) {
    const categoryInfo = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.AUTRE;
    const availabilityInfo = AVAILABILITY_CONFIG[item.availability] || AVAILABILITY_CONFIG.DISPONIBLE;

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/commercial/products/${item.id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: availabilityInfo.bgColor }]}>
              <Text style={[styles.badgeText, { color: availabilityInfo.color }]}>
                {availabilityInfo.label}
              </Text>
            </View>
          </View>
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.bgColor }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryInfo.color }]}>
                {categoryInfo.label}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Prix indicatif</Text>
          <Text style={styles.priceValue}>{Number(item.price).toFixed(2)} MAD</Text>
        </View>

        {item.specifications ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📋</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.specifications}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          {canEdit && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/commercial/products/${item.id}/edit` as any);
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
                handleDeleteProduct(item);
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
            <Text style={styles.title}>Catalogue produits</Text>
            <Text style={styles.subtitle}>
              {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
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
                fetchProducts(1).finally(() => setLoading(false));
              }}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          <FilterChip
            label="Catégorie"
            options={[
              { value: "ALL", label: "Toutes" },
              ...Object.entries(CATEGORY_CONFIG).map(([value, config]) => ({ value: value as ProductCategory, label: config.label })),
            ]}
            selected={categoryFilter}
            onSelect={handleCategoryChange}
          />
          <FilterChip
            label="Disponibilité"
            options={[
              { value: "ALL", label: "Tous" },
              ...Object.entries(AVAILABILITY_CONFIG).map(([value, config]) => ({ value: value as ProductAvailability, label: config.label })),
            ]}
            selected={availabilityFilter}
            onSelect={handleAvailabilityChange}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun produit trouvé.</Text>
            }
            renderItem={renderProductItem}
          />
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => fetchProducts(page - 1)}
          onNext={() => fetchProducts(page + 1)}
        />

        {canCreate && (
          <Link href={"/commercial/products/create" as any} asChild>
            <Pressable style={styles.fab}>
              <Text style={styles.fabIcon}>+</Text>
            </Pressable>
          </Link>
        )}
      </View>
    </SafeAreaView>
  );
}

function FilterChip<T extends ProductCategory | ProductAvailability | "ALL">({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.filterChipContainer}>
      <Text style={styles.filterChipLabel}>{label}</Text>
      <View style={styles.filterChipRow}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[
              styles.filterChip,
              selected === option.value && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                selected === option.value && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
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
  filterRow: { flexDirection: "row", gap: 12, marginBottom: 14, flexWrap: "wrap" },
  filterChipContainer: { flex: 1, minWidth: 150 },
  filterChipLabel: { fontSize: 12, fontWeight: "600", color: "#666", marginBottom: 6 },
  filterChipRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  filterChipActive: { backgroundColor: "#DCFCE7", borderColor: GREEN },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#555" },
  filterChipTextActive: { color: GREEN },
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
    marginBottom: 8,
  },
  name: { fontSize: 17, fontWeight: "800", color: GREEN, flex: 1, marginRight: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  categoryRow: { flexDirection: "row", gap: 8 },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "700" },
  description: { fontSize: 14, color: "#555", lineHeight: 20, marginBottom: 10 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  priceLabel: { fontSize: 12, color: "#666", fontWeight: "600" },
  priceValue: { fontSize: 16, fontWeight: "800", color: "#111" },
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
