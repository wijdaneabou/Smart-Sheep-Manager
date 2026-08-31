import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePermissions } from "@/contexts/PermissionsContext";
import { listSegments, deleteSegment } from "@/services/loyaltyService";
import type { Segment } from "@/services/loyaltyService";

const PAGE_SIZE = 20;

export default function SegmentsIndex() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("CRM", "CREATE");
  const canUpdate = hasPermission("CRM", "UPDATE");
  const canDelete = hasPermission("CRM", "DELETE");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Segment[]>([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async (searchQuery: string) => {
    const res = await listSegments({ page: 1, limit: PAGE_SIZE, search: searchQuery || undefined });
    if (res.success) {
      setItems(res.data);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      setLoading(true);
      await load(search);
      if (active) setLoading(false);
    }
    init();
    return () => { active = false; };
  }, [search, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  };

  const handleDelete = (item: Segment) => {
    Alert.alert("Supprimer le segment", `Voulez-vous supprimer "${item.name}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const res = await deleteSegment(item.id);
          if (res.success) {
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          } else {
            Alert.alert("Erreur", res.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Segment }) => (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={[styles.colorDot, { backgroundColor: item.color || "#15803D" }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.description ? <Text style={styles.cardSubtitle} numberOfLines={2}>{item.description}</Text> : null}
        <Text style={styles.cardMeta}>
          Score {item.minScore}-{item.maxScore} · Fréq. {item.minFrequency}{item.maxFrequency ? `-${item.maxFrequency}` : "+"}{" "}
          · Panier {item.minBasket}{item.maxBasket ? `-${item.maxBasket}` : "+"} MAD
        </Text>
      </View>
      <View style={styles.cardActions}>
        {canUpdate && (
          <Pressable onPress={() => router.push(`/commercial/loyalty/segments/${item.id}` as any)}>
            <Ionicons name="create-outline" size={22} color="#15803D" />
          </Pressable>
        )}
        {canDelete && (
          <Pressable onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={22} color="#DC2626" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#5C8A72" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un segment..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#5C8A72"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#5C8A72" />
            </Pressable>
          )}
        </View>
        {canCreate && (
          <Pressable style={styles.fab} onPress={() => router.push("/commercial/loyalty/segments/create" as any)}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#15803D" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>Aucun segment trouvé</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2FAF5" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, paddingBottom: 8 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#0F2A1D" },
  fab: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#15803D", alignItems: "center", justifyContent: "center", shadowColor: "#15803D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  listContent: { padding: 16, paddingTop: 8 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, gap: 12, shadowColor: "#0F2A1D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  cardPressed: { opacity: 0.8 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F2A1D" },
  cardSubtitle: { fontSize: 13, color: "#5C8A72", marginTop: 2 },
  cardMeta: { fontSize: 11, color: "#8EBC9B", marginTop: 4, fontWeight: "500" },
  cardActions: { flexDirection: "row", gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  empty: { fontSize: 14, color: "#5C8A72", fontWeight: "500" },
});
