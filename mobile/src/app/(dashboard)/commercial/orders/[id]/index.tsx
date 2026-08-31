import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getOrderById, deleteOrder, updateOrder, type Order, type OrderItem, type OrderStatus } from "../../../../../services/ordersService";
import { usePermissions } from "@/contexts/PermissionsContext";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap }> = {
  BROUILLON: { label: "Brouillon", color: "#666", bgColor: "#F3F4F6", icon: "document-outline" },
  ENVOYE: { label: "Envoyé", color: "#2563EB", bgColor: "#DBEAFE", icon: "send-outline" },
  VALIDE: { label: "Validé", color: "#15803D", bgColor: "#DCFCE7", icon: "checkmark-circle-outline" },
  EN_PREPARATION: { label: "En préparation", color: "#D97706", bgColor: "#FEF3C7", icon: "construct-outline" },
  EXPEDIE: { label: "Expédié", color: "#7C3AED", bgColor: "#EDE9FE", icon: "airplane-outline" },
  LIVRE: { label: "Livré", color: "#1D4ED8", bgColor: "#DBEAFE", icon: "cube-outline" },
  FACTURE: { label: "Facturé", color: "#DC2626", bgColor: "#FEE2E2", icon: "receipt-outline" },
  PAYE: { label: "Payé", color: "#15803D", bgColor: "#DCFCE7", icon: "cash-outline" },
};

const GREEN = "#0F7A3C";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasPermission } = usePermissions();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasPermission("ORDERS", "UPDATE");
  const canDelete = hasPermission("ORDERS", "DELETE");

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      const result = await getOrderById(Number(id));
      setLoading(false);
      if (result.success) {
        setOrder(result.order);
        setItems(result.items);
      } else {
        setError(result.message);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!order || !canDelete) return;
    Alert.alert(
      "Supprimer la commande",
      `Voulez-vous vraiment supprimer la commande "${order.orderNumber}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await deleteOrder(order.id);
            if (result.success) {
              router.back();
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  function handleStatusChange(newStatus: OrderStatus) {
    if (!order) return;
    Alert.alert(
      "Changer le statut",
      `Passer la commande à "${STATUS_CONFIG[newStatus].label}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            const result = await updateOrder(order.id, { status: newStatus });
            if (result.success) {
              setOrder(result.order);
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || "Commande introuvable."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.BROUILLON;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Détail commande</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👤</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Client</Text>
              <Text style={styles.detailValue}>{order.clientName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📞</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Contact</Text>
              <Text style={styles.detailValue}>{order.clientContact}</Text>
            </View>
          </View>

          {order.notes ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📝</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{order.notes}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Articles</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemDetail}>
                  {item.quantity} x {Number(item.unitPrice).toFixed(2)} MAD
                </Text>
              </View>
              <Text style={styles.itemTotal}>{Number(item.totalPrice).toFixed(2)} MAD</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totaux</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{Number(order.subtotal).toFixed(2)} MAD</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Taxe</Text>
            <Text style={styles.totalValue}>{Number(order.tax).toFixed(2)} MAD</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalLabelFinal}>Total</Text>
            <Text style={styles.totalValueFinal}>{Number(order.total).toFixed(2)} MAD</Text>
          </View>
        </View>

        {canEdit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changer le statut</Text>
            <View style={styles.statusGrid}>
              {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((statusKey) => {
                const statusConf = STATUS_CONFIG[statusKey];
                return (
                  <Pressable
                    key={statusKey}
                    style={[
                      styles.statusButton,
                      order.status === statusKey && styles.statusButtonActive,
                      { backgroundColor: order.status === statusKey ? statusConf.bgColor : "#fff" },
                    ]}
                    onPress={() => handleStatusChange(statusKey)}
                  >
                    <Ionicons name={statusConf.icon} size={16} color={statusConf.color} />
                    <Text style={[styles.statusButtonText, { color: statusConf.color }]}>
                      {statusConf.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          {canEdit && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: "#EFF6FF" }]}
              onPress={() => router.push(`/commercial/orders/${order.id}/edit` as any)}
            >
              <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
              <Text style={[styles.actionText, { color: "#3B82F6" }]}>Modifier</Text>
            </Pressable>
          )}
          {canDelete && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: "#FEF2F2" }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.actionText, { color: "#EF4444" }]}>Supprimer</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#dc2626", fontSize: 15, textAlign: "center", marginHorizontal: 24 },

  container: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: "800", color: "#111" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  orderNumber: { fontSize: 20, fontWeight: "800", color: GREEN, flex: 1, marginRight: 8 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailIcon: { fontSize: 18, width: 28, color: "#666", marginTop: 2 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: "600", color: "#333" },

  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#333" },
  itemDetail: { fontSize: 12, color: "#666", marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: "700", color: GREEN, marginRight: 8 },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  totalRowFinal: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: GREEN,
  },
  totalLabel: { fontSize: 14, color: "#666", fontWeight: "600" },
  totalValue: { fontSize: 14, fontWeight: "700", color: "#333" },
  totalLabelFinal: { fontSize: 16, fontWeight: "800", color: GREEN },
  totalValueFinal: { fontSize: 16, fontWeight: "800", color: GREEN },

  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 6,
  },
  statusButtonActive: {
    borderWidth: 1,
  },
  statusButtonText: { fontSize: 12, fontWeight: "600" },

  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionText: { fontSize: 14, fontWeight: "700" },
});
