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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { getClientById, deleteClient, type Client, type ClientType } from "../../../../../services/clientsService";
import { usePermissions } from "@/contexts/PermissionsContext";

const CLIENT_TYPE_CONFIG: Record<ClientType, { label: string; color: string; bgColor: string }> = {
  ACHETEUR: { label: "Acheteur", color: "#15803D", bgColor: "#DCFCE7" },
  BOUCHER: { label: "Boucher", color: "#1D4ED8", bgColor: "#DBEAFE" },
  GROSSISTE: { label: "Grossiste", color: "#D97706", bgColor: "#FEF3C7" },
  COOPERATIVE: { label: "Coopérative", color: "#7C3AED", bgColor: "#EDE9FE" },
};

const GREEN = "#0F7A3C";
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://172.27.182.10:3000";

function buildQrDataUrl(client: Client): string {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${client.name}`,
    `NOTE:Client ${CLIENT_TYPE_CONFIG[client.type]?.label || client.type}`,
    `TEL;TYPE=WORK:${client.contact}`,
    client.preferences ? `PREFERENCE:${client.preferences}` : undefined,
    client.notes ? `REMARK:${client.notes}` : undefined,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");

  const encoded = encodeURIComponent(vcard);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
}

export default function ClientDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasPermission } = usePermissions();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasPermission("CLIENTS", "UPDATE");
  const canDelete = hasPermission("CLIENTS", "DELETE");

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      const result = await getClientById(Number(id));
      setLoading(false);
      if (result.success) {
        setClient(result.client);
      } else {
        setError(result.message);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!client || !canDelete) return;
    Alert.alert(
      "Supprimer le client",
      `Voulez-vous vraiment supprimer "${client.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await deleteClient(client.id);
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
    if (!client) return;
    const qrUrl = buildQrDataUrl(client);
    try {
      await Share.share({
        message: `Carte de visite - ${client.name}\nType: ${CLIENT_TYPE_CONFIG[client.type]?.label}\nContact: ${client.contact}`,
        url: qrUrl,
      });
    } catch {
      Alert.alert("Erreur", "Impossible de partager le QR code.");
    }
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

  if (error || !client) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || "Client introuvable."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = CLIENT_TYPE_CONFIG[client.type] || CLIENT_TYPE_CONFIG.ACHETEUR;
  const qrUrl = buildQrDataUrl(client);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Détail du client</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.clientName}>{client.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: typeInfo.bgColor }]}>
              <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                {typeInfo.label}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📞</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Contact</Text>
              <Text style={styles.detailValue}>{client.contact}</Text>
            </View>
          </View>

          {client.preferences ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🎯</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Préférences</Text>
                <Text style={styles.detailValue}>{client.preferences}</Text>
              </View>
            </View>
          ) : null}

          {client.notes ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📝</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{client.notes}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>
              Créé le {new Date(client.createdAt).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Carte de visite digitale</Text>
          <View style={styles.qrCard}>
            <Image
              source={{ uri: qrUrl }}
              style={styles.qrImage}
              contentFit="contain"
              transition={200}
            />
            <Text style={styles.qrCaption}>
              Scannez pour enregistrer les coordonnées
            </Text>
            <Pressable style={styles.shareButton} onPress={handleShareQr}>
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Partager le QR</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actionRow}>
          {canEdit && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: "#EFF6FF" }]}
              onPress={() => router.push(`/commercial/clients/${client.id}/edit` as any)}
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
  clientName: { fontSize: 20, fontWeight: "800", color: GREEN, flex: 1, marginRight: 8 },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: { fontSize: 12, fontWeight: "700" },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailIcon: { fontSize: 18, width: 28, color: "#666", marginTop: 2 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: "600", color: "#333" },

  dateRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  dateLabel: { fontSize: 12, color: "#aaa", fontWeight: "600" },

  qrSection: { marginBottom: 16 },
  qrTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrCaption: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

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
