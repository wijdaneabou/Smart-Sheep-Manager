import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { getProductById, deleteProduct, getProductCatalogQr, getProductCatalogPdf, type Product, type ProductCategory, type ProductAvailability } from "../../../../../services/productsService";
import { usePermissions } from "@/contexts/PermissionsContext";
import { getFileUrl } from "@/services/api";

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

const GREEN = "#0F7A3C";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasPermission } = usePermissions();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const canEdit = hasPermission("PRODUCTS", "UPDATE");
  const canDelete = hasPermission("PRODUCTS", "DELETE");

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      const result = await getProductById(Number(id));
      setLoading(false);
      if (result.success) {
        setProduct(result.product);
        if (result.product.photos) {
          setPhotos(result.product.photos.split(",").map((p) => p.trim()).filter(Boolean));
        }
      } else {
        setError(result.message);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!product || !canDelete) return;
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
              router.back();
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  async function handleShareQr() {
    const result = await getProductCatalogQr();
    if (result.success && result.qrUrl) {
      try {
        await Share.share({
          message: `Catalogue produits Smart Sheep Manager\nScannez le QR code pour consulter le catalogue.`,
          url: result.qrUrl,
        });
      } catch {
        Alert.alert("Erreur", "Impossible de partager le QR code.");
      }
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  async function handleExportPdf() {
    Alert.alert("Export PDF", "Générer et télécharger le catalogue PDF ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Télécharger",
        onPress: async () => {
          const result = await getProductCatalogPdf();
          if (result.success && result.pdfUrl) {
            const fullUrl = getFileUrl(result.pdfUrl);
            if (fullUrl) {
              try {
                await Linking.openURL(fullUrl);
              } catch {
                Alert.alert("Erreur", "Impossible d'ouvrir le PDF.");
              }
            }
          } else {
            Alert.alert("Erreur", result.message || "Impossible de générer le PDF.");
          }
        },
      },
    ]);
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

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || "Produit introuvable."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryInfo = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG.AUTRE;
  const availabilityInfo = AVAILABILITY_CONFIG[product.availability] || AVAILABILITY_CONFIG.DISPONIBLE;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Détail du produit</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={[styles.badge, { backgroundColor: categoryInfo.bgColor }]}>
              <Text style={[styles.badgeText, { color: categoryInfo.color }]}>
                {categoryInfo.label}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📝</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{product.description}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💰</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Prix indicatif</Text>
              <Text style={styles.detailValue}>{Number(product.price).toFixed(2)} MAD</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📦</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Disponibilité</Text>
              <View style={[styles.statusBadge, { backgroundColor: availabilityInfo.bgColor }]}>
                <Text style={[styles.statusBadgeText, { color: availabilityInfo.color }]}>
                  {availabilityInfo.label}
                </Text>
              </View>
            </View>
          </View>

          {product.specifications ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📋</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fiche technique</Text>
                <Text style={styles.detailValue}>{product.specifications}</Text>
              </View>
            </View>
          ) : null}

          {photos.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={styles.photosTitle}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    style={styles.photo}
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>
              Créé le {new Date(product.createdAt).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {canEdit && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: "#EFF6FF" }]}
              onPress={() => router.push(`/commercial/products/${product.id}/edit` as any)}
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

        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Catalogue</Text>
          <View style={styles.exportRow}>
            <Pressable style={[styles.exportButton, { backgroundColor: "#EFF6FF" }]} onPress={handleExportPdf}>
              <Ionicons name="document-outline" size={20} color="#3B82F6" />
              <Text style={[styles.exportButtonText, { color: "#3B82F6" }]}>Exporter PDF</Text>
            </Pressable>
            <Pressable style={[styles.exportButton, { backgroundColor: "#F0FDF4" }]} onPress={handleShareQr}>
              <Ionicons name="qr-code-outline" size={20} color="#15803D" />
              <Text style={[styles.exportButtonText, { color: "#15803D" }]}>Partager QR</Text>
            </Pressable>
          </View>
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
  productName: { fontSize: 20, fontWeight: "800", color: GREEN, flex: 1, marginRight: 8 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailIcon: { fontSize: 18, width: 28, color: "#666", marginTop: 2 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: "600", color: "#333" },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },

  photosSection: { marginTop: 16 },
  photosTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 10 },
  photo: { width: 200, height: 150, borderRadius: 12, marginRight: 12 },

  dateRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  dateLabel: { fontSize: 12, color: "#aaa", fontWeight: "600" },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
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

  exportSection: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  exportRow: {
    flexDirection: "row",
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  exportButtonText: { fontSize: 14, fontWeight: "700" },
});
