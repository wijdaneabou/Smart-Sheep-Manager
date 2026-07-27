import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  listMovements,
  type AnimalMovement,
  type MovementType,
} from "@/services/animalMovementsService";
import {
  MOVEMENT_TYPES,
  getMovementTypeInfo,
  type MovementTypeInfo,
} from "@/constants/movements";

export default function MovementsScreen() {
  const router = useRouter();
  const [movements, setMovements] = useState<AnimalMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<MovementType | "all">("all");

  const filters =
    activeType === "all" ? {} : { type: activeType as MovementType };

  async function fetchMovements() {
    setError(null);
    const result = await listMovements(filters);
    if (result.success) {
      setMovements(result.movements);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMovements().finally(() => setLoading(false));
    }, [activeType])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Mouvements du troupeau</Text>
        <Pressable
          onPress={() => router.push("/herd/movements/create" as any)}
          style={styles.addButton}
          hitSlop={8}
        >
          <Text style={styles.addIcon}>➕</Text>
        </Pressable>
      </View>

      {/* Type filter pills */}
      <View style={styles.filterRow}>
        {MOVEMENT_TYPES.map((type: MovementTypeInfo) => {
          const isActive = activeType === type.id;
          return (
            <Pressable
              key={type.id}
              onPress={() => setActiveType(type.id)}
              style={[
                styles.filterPill,
                isActive && { backgroundColor: type.bgColor, borderColor: type.color },
              ]}
            >
              <Text style={[styles.filterPillText, isActive && { color: type.color, fontWeight: "700" }]}>
                {type.icon} {type.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : movements.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Aucun mouvement</Text>
          <Text style={styles.empty}>
            Aucun mouvement enregistré pour cette catégorie.
          </Text>
        </View>
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(item) => `movement-${item.id}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <MovementCard movement={item} />}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      )}
    </SafeAreaView>
  );
}

function MovementCard({ movement }: { movement: AnimalMovement }) {
  const typeInfo = getMovementTypeInfo(movement.type);
  const dateStr = new Date(movement.date).toLocaleDateString("fr-FR");
  const priceStr = movement.price
    ? `${Number(movement.price).toLocaleString("fr-FR")} €`
    : "—";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: typeInfo.bgColor }]}>
          <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
          <Text style={[styles.typeLabel, { color: typeInfo.color }]}>
            {typeInfo.label}
          </Text>
        </View>
        <Text style={styles.cardDate}>{dateStr}</Text>
      </View>

      <Text style={styles.cardTitle}>
        Animal #{movement.animalId}
      </Text>

      {movement.reason ? (
        <Text style={styles.cardReason}>{movement.reason}</Text>
      ) : null}

      <View style={styles.cardDetails}>
        {movement.sourceDestination ? (
          <Text style={styles.cardDetail}>📍 {movement.sourceDestination}</Text>
        ) : null}
        {movement.price ? (
          <Text style={styles.cardDetail}>💰 {priceStr}</Text>
        ) : null}
      </View>
    </View>
  );
}

const PAGE_BG = "#faf3ea";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backButtonText: { fontSize: 26, color: "#1a1a1a", fontWeight: "400" },
  headerTitle: { fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },
  addButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#059669", borderRadius: 10 },
  addIcon: { fontSize: 18, color: "#fff" },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  filterPillText: { fontSize: 12, color: "#555" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  error: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 4 },
  empty: { fontSize: 13, color: "#888", textAlign: "center" },

  listContent: { paddingHorizontal: 16, paddingBottom: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeIcon: { fontSize: 12 },
  typeLabel: { fontSize: 11, fontWeight: "700" },
  cardDate: { fontSize: 12, color: "#999" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0F2A1D", marginBottom: 4 },
  cardReason: { fontSize: 13, color: "#555", marginBottom: 6, lineHeight: 18 },
  cardDetails: { gap: 2 },
  cardDetail: { fontSize: 12, color: "#666", lineHeight: 17 },
});
