import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import feedingService, {
  type FeedItem,
} from "../../../services/feedingService";
import {
  LoadingScreen,
  ErrorMessage,
  EmptyState,
  parseNumber,
  formatNumber,
} from "./components/FeedingShared";
import PurchaseModal from "./components/PurchaseModal";

type AlertItem = {
  id: number;
  name: string;
  category: string;
  currentStock: string;
  minStockThreshold: string;
  unitPrice: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  gapToMin: string;
  percentageOfMin: number;
  estimatedReorderCost: string;
};

type ExpiryAlert = {
  id: number;
  feedItemName: string;
  category: string;
  batchNumber?: string;
  quantity: string;
  expiryDate: string;
  daysLeft: number | null;
  status: "EXPIRED" | "CRITICAL" | "WARNING" | "SOON";
};

export default function StockScreen() {
  const [stockByType, setStockByType] = useState<any[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<AlertItem[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  const criticalCount = criticalAlerts.filter(
    (a) => a.severity === "CRITICAL" || a.severity === "HIGH"
  ).length;

  const expiryCount = expiryAlerts.filter(
    (a) => a.status === "EXPIRED" || a.status === "CRITICAL"
  ).length;

  async function loadStockData() {
    setError(null);
    try {
      const [stockData, criticalData, expiryData, items] =
        await Promise.all([
          feedingService.getStockByType({ includeEmpty: true }),
          feedingService.getCriticalStockAlerts(),
          feedingService.getExpiryAlerts({ daysWindow: 30, onlyWithStock: true }),
          feedingService.getFeedItems(),
        ]);
      setStockByType(stockData || []);
      setCriticalAlerts(criticalData?.alerts || []);
      setExpiryAlerts(expiryData?.alerts || []);
      setFeedItems(items || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible de charger le stock."
      );
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadStockData().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadStockData();
    setRefreshing(false);
  }

  async function handlePurchaseCreated() {
    setSaving(true);
    await loadStockData();
    setSaving(false);
  }

  const allItems = useMemo(() => {
    return stockByType.flatMap((group) => group.items || []);
  }, [stockByType]);

  const totalStockValue = useMemo(() => {
    return allItems.reduce(
      (sum, item) => sum + parseNumber(item.valueAtCost || "0"),
      0
    );
  }, [allItems]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Stock alimentaire</Text>
            <Text style={styles.subtitle}>
              {allItems.length} aliment{allItems.length !== 1 ? "s" : ""} •{" "}
              {formatNumber(totalStockValue)} DH de stock
            </Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => setPurchaseModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {error ? <ErrorMessage message={error} /> : null}

        <View style={styles.alertSection}>
          <Text style={styles.sectionTitle}>Alertes</Text>
          <View style={styles.alertRow}>
            <View style={[styles.alertCard, criticalCount > 0 && styles.alertCardDanger]}>
              <Ionicons
                name="warning-outline"
                size={22}
                color={criticalCount > 0 ? "#B42318" : "#5C7468"}
              />
              <Text style={styles.alertValue}>{criticalCount}</Text>
              <Text style={styles.alertLabel}>Stock bas</Text>
            </View>
            <View style={[styles.alertCard, expiryCount > 0 && styles.alertCardWarning]}>
              <Ionicons
                name="time-outline"
                size={22}
                color={expiryCount > 0 ? "#D97706" : "#5C7468"}
              />
              <Text style={styles.alertValue}>{expiryCount}</Text>
              <Text style={styles.alertLabel}>Peremption</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.actionCard}
            onPress={() => setPurchaseModalVisible(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#15803D" }]}>
              <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Nouvel achat</Text>
              <Text style={styles.actionSubtitle}>
                Ajouter un approvisionnement
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#5C7468" />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stock par categorie</Text>
        </View>

        {stockByType.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="Aucun stock"
            text="Ajoute des aliments et enregistre des achats pour voir le stock."
          />
        ) : (
          <View style={styles.categoryList}>
            {stockByType.map((group) => (
              <View key={group.category} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIcon}>
                    <Ionicons name="pricetag-outline" size={18} color="#17633A" />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>
                      {group.category === "FOURRAGE"
                        ? "Foin / Fourrage"
                        : group.category === "CONCENTRE"
                        ? "Concentre"
                        : group.category === "MINERAL"
                        ? "Mineraux"
                        : group.category === "VITAMINE"
                        ? "Vitamines"
                        : group.category === "COMPLEMENT"
                        ? "Complements"
                        : "Autre"}
                    </Text>
                    <Text style={styles.categoryMeta}>
                      {group.itemCount} article{group.itemCount !== 1 ? "s" : ""} •{" "}
                      {group.totalQuantity} kg
                    </Text>
                  </View>
                  <Text style={styles.categoryValue}>
                    {group.totalValueAtCost} DH
                  </Text>
                </View>

                <View style={styles.itemList}>
                  {(group.items || []).map((item: any) => {
                    const stockNum = parseNumber(item.currentStock);
                    const minNum = parseNumber(item.minStockThreshold);
                    const isLow = minNum > 0 && stockNum <= minNum;
                    const ratio = minNum > 0 ? Math.round((stockNum / minNum) * 100) : null;

                    return (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemMeta}>
                            {stockNum.toFixed(1)} kg / seuil: {minNum.toFixed(1)} kg
                            {ratio !== null && (
                              <Text
                                style={[
                                  styles.ratioBadge,
                                  { color: isLow ? "#B42318" : "#17633A" },
                                ]}
                              >
                                {" "}
                                ({ratio}%)
                              </Text>
                            )}
                          </Text>
                        </View>
                        <View style={styles.itemRight}>
                          <Text style={styles.itemValue}>
                            {formatNumber(item.valueAtCost)} DH
                          </Text>
                          {isLow && (
                            <View style={styles.lowBadge}>
                              <Text style={styles.lowBadgeText}>Bas</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alertes stock critique</Text>
        </View>

        {criticalAlerts.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="Stock OK"
            text="Aucune alerte de stock critique."
          />
        ) : (
          <View style={styles.alertList}>
            {criticalAlerts.map((alert) => (
              <View
                key={alert.id}
                style={[
                  styles.alertItem,
                  alert.severity === "CRITICAL" && styles.alertItemCritical,
                ]}
              >
                <View style={styles.alertItemHeader}>
                  <View style={styles.alertItemInfo}>
                    <Text style={styles.alertItemName}>{alert.name}</Text>
                    <Text style={styles.alertItemMeta}>
                      {parseNumber(alert.currentStock).toFixed(1)} kg / seuil:{" "}
                      {parseNumber(alert.minStockThreshold).toFixed(1)} kg
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(alert.severity) },
                    ]}
                  >
                    <Text style={styles.severityText}>
                      {alert.severity === "CRITICAL"
                        ? "Critique"
                        : alert.severity === "HIGH"
                        ? "Eleve"
                        : alert.severity === "MEDIUM"
                        ? "Moyen"
                        : "Faible"}
                    </Text>
                  </View>
                </View>
                <View style={styles.alertItemFooter}>
                  <Text style={styles.alertItemCost}>
                    Manque: {alert.gapToMin} kg • Cout estime:{" "}
                    {formatNumber(alert.estimatedReorderCost)} DH
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alertes de peremption</Text>
        </View>

        {expiryAlerts.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Pas de peremption proche"
            text="Aucun lot expire dans les 30 prochains jours."
          />
        ) : (
          <View style={styles.alertList}>
            {expiryAlerts.map((alert) => (
              <View
                key={alert.id}
                style={[
                  styles.alertItem,
                  alert.status === "EXPIRED" && styles.alertItemCritical,
                  alert.status === "CRITICAL" && styles.alertItemWarning,
                ]}
              >
                <View style={styles.alertItemHeader}>
                  <View style={styles.alertItemInfo}>
                    <Text style={styles.alertItemName}>
                      {alert.feedItemName}
                    </Text>
                    <Text style={styles.alertItemMeta}>
                      Lot: {alert.batchNumber || "N/A"} •{" "}
                      {parseNumber(alert.quantity).toFixed(1)} kg
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getExpiryColor(alert.status) },
                    ]}
                  >
                    <Text style={styles.severityText}>
                      {alert.daysLeft !== null
                        ? `${alert.daysLeft}j`
                        : "N/A"}
                    </Text>
                  </View>
                </View>
                <View style={styles.alertItemFooter}>
                  <Text style={styles.alertItemCost}>
                    Peremption: {alert.expiryDate} •{" "}
                    {alert.status === "EXPIRED"
                      ? "Expire"
                      : alert.status === "CRITICAL"
                      ? "Critique"
                      : alert.status === "WARNING"
                      ? "Attention"
                      : "Bientot"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <PurchaseModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        feedItems={feedItems}
        saving={saving}
        onPurchaseCreated={handlePurchaseCreated}
      />
    </SafeAreaView>
  );
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "#FEE2E2";
    case "HIGH":
      return "#FFEDD5";
    case "MEDIUM":
      return "#FEF3C7";
    default:
      return "#F3F4F6";
  }
}

function getExpiryColor(status: string) {
  switch (status) {
    case "EXPIRED":
      return "#FEE2E2";
    case "CRITICAL":
      return "#FFEDD5";
    case "WARNING":
      return "#FEF3C7";
    default:
      return "#F3F4F6";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF6",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: "#10281D",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#5C7468",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17633A",
  },
  alertSection: {
    gap: 10,
  },
  sectionTitle: {
    color: "#10281D",
    fontSize: 18,
    fontWeight: "900",
  },
  alertRow: {
    flexDirection: "row",
    gap: 10,
  },
  alertCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  alertCardDanger: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  alertCardWarning: {
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
  },
  alertValue: {
    color: "#10281D",
    fontSize: 24,
    fontWeight: "900",
  },
  alertLabel: {
    color: "#5C7468",
    fontSize: 12,
    fontWeight: "700",
  },
  actionsRow: {
    gap: 10,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#17633A",
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: "#10281D",
    fontSize: 15,
    fontWeight: "900",
  },
  actionSubtitle: {
    color: "#5C7468",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 4,
  },
  categoryList: {
    gap: 10,
  },
  categoryCard: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 14,
    gap: 10,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E8F5EC",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: "#10281D",
    fontSize: 15,
    fontWeight: "900",
  },
  categoryMeta: {
    color: "#5C7468",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  categoryValue: {
    color: "#17633A",
    fontSize: 14,
    fontWeight: "800",
  },
  itemList: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2EFE7",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: "#10281D",
    fontSize: 14,
    fontWeight: "800",
  },
  itemMeta: {
    color: "#5C7468",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  ratioBadge: {
    fontWeight: "800",
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  itemValue: {
    color: "#10281D",
    fontSize: 14,
    fontWeight: "900",
  },
  lowBadge: {
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lowBadgeText: {
    color: "#B42318",
    fontSize: 11,
    fontWeight: "800",
  },
  alertList: {
    gap: 8,
  },
  alertItem: {
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 14,
    gap: 8,
  },
  alertItemCritical: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  alertItemWarning: {
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
  },
  alertItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertItemInfo: {
    flex: 1,
  },
  alertItemName: {
    color: "#10281D",
    fontSize: 14,
    fontWeight: "900",
  },
  alertItemMeta: {
    color: "#5C7468",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  severityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10281D",
  },
  alertItemFooter: {
    marginTop: 4,
  },
  alertItemCost: {
    color: "#5C7468",
    fontSize: 12,
    fontWeight: "700",
  },
});
