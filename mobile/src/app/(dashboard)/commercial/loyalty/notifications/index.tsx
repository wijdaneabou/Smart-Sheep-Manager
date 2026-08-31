import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePermissions } from "@/contexts/PermissionsContext";
import { listNotifications } from "@/services/loyaltyService";
import type { LoyaltyNotification } from "@/services/loyaltyService";

const PAGE_SIZE = 20;

export default function NotificationsIndex() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("CRM", "CREATE");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<LoyaltyNotification[]>([]);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const load = useCallback(async (unreadOnly: boolean) => {
    const res = await listNotifications({ page: 1, limit: PAGE_SIZE, unreadOnly });
    if (res.success) {
      setItems(res.data);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      setLoading(true);
      await load(filter === "UNREAD");
      if (active) setLoading(false);
    }
    init();
    return () => { active = false; };
  }, [filter, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(filter === "UNREAD");
    setRefreshing(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

  const typeLabel: Record<string, { label: string; color: string; bg: string }> = {
    AVAILABILITY: { label: "Disponibilité", color: "#15803D", bg: "#E6F8ED" },
    PRICE_DROP: { label: "Baisse de prix", color: "#166534", bg: "#F3E8FF" },
    NEW_ARRIVAL: { label: "Nouveauté", color: "#2F855A", bg: "#E6F8ED" },
  };

  const renderItem = ({ item }: { item: LoyaltyNotification }) => {
    const meta = typeLabel[item.type] || { label: item.type, color: "#5C8A72", bg: "#E5E7EB" };
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed, !item.isRead && styles.unreadCard]}
      >
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMessage} numberOfLines={3}>{item.message}</Text>
          <Text style={styles.cardMeta}>
            {item.sentAt ? `Envoyée le ${formatDate(item.sentAt)}` : `Créée le ${formatDate(item.createdAt)}`}
            {!item.isRead && <Text style={styles.unreadDot}> · Non lue</Text>}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterBtn, filter === "ALL" && styles.filterBtnActive]}
          onPress={() => setFilter("ALL")}
        >
          <Text style={[styles.filterText, filter === "ALL" && styles.filterTextActive]}>Toutes</Text>
        </Pressable>
        <Pressable
          style={[styles.filterBtn, filter === "UNREAD" && styles.filterBtnActive]}
          onPress={() => setFilter("UNREAD")}
        >
          <Text style={[styles.filterText, filter === "UNREAD" && styles.filterTextActive]}>Non lues</Text>
        </Pressable>
        {canCreate && (
          <Pressable style={styles.fab} onPress={() => router.push("/commercial/loyalty/notifications/create" as any)}>
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
              <Text style={styles.empty}>Aucune notification</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2FAF5" },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, paddingBottom: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" },
  filterBtnActive: { backgroundColor: "#15803D", borderColor: "#15803D" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#5C8A72" },
  filterTextActive: { color: "#FFFFFF" },
  fab: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#15803D", alignItems: "center", justifyContent: "center", shadowColor: "#15803D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  listContent: { padding: 16, paddingTop: 8 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, gap: 10, shadowColor: "#0F2A1D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  cardPressed: { opacity: 0.8 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: "#15803D" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F2A1D" },
  cardMessage: { fontSize: 13, color: "#5C8A72", marginTop: 2 },
  cardMeta: { fontSize: 11, color: "#8EBC9B", marginTop: 4, fontWeight: "500" },
  unreadDot: { color: "#15803D", fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  empty: { fontSize: 14, color: "#5C8A72", fontWeight: "500" },
});
