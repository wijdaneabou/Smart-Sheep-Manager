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
import {
  getFrameworkContractById,
  updateFrameworkContract,
  deleteFrameworkContract,
  type FrameworkContract,
  type ContractStatus,
} from "../../../../services/frameworkContractsService";
import { usePermissions } from "@/contexts/PermissionsContext";

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap }> = {
  EN_NEGOCIATION: { label: "En négociation", color: "#D97706", bgColor: "#FEF3C7", icon: "time-outline" },
  ACTIF: { label: "Actif", color: "#15803D", bgColor: "#DCFCE7", icon: "checkmark-circle-outline" },
  EXPIRE: { label: "Expiré", color: "#DC2626", bgColor: "#FEE2E2", icon: "close-circle-outline" },
  RESILIE: { label: "Résilié", color: "#666", bgColor: "#F3F4F6", icon: "ban-outline" },
};

const GREEN = "#0F7A3C";

export default function FrameworkContractDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasPermission } = usePermissions();

  const [contract, setContract] = useState<FrameworkContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasPermission("FRAMEWORK_CONTRACTS", "UPDATE");
  const canDelete = hasPermission("FRAMEWORK_CONTRACTS", "DELETE");

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      const result = await getFrameworkContractById(Number(id));
      setLoading(false);
      if (result.success) {
        setContract(result.contract);
      } else {
        setError(result.message);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!contract || !canDelete) return;
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
              router.back();
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  function handleStatusChange(newStatus: ContractStatus) {
    if (!contract) return;
    Alert.alert(
      "Changer le statut",
      `Passer le contrat à "${STATUS_CONFIG[newStatus].label}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            const result = await updateFrameworkContract(contract.id, { status: newStatus });
            if (result.success) {
              setContract(result.contract);
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

  if (error || !contract) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || "Contrat introuvable."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = STATUS_CONFIG[contract.status] || STATUS_CONFIG.EN_NEGOCIATION;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Détail contrat cadre</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.contractNumber}>{contract.contractNumber}</Text>
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
              <Text style={styles.detailValue}>{contract.clientName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Durée</Text>
              <Text style={styles.detailValue}>{contract.startDate} → {contract.endDate}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📦</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Volumes</Text>
              <Text style={styles.detailValue}>Mensuel: {contract.monthlyVolume} | Annuel: {contract.yearlyVolume}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💰</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Prix négocié</Text>
              <Text style={styles.detailValue}>{contract.negotiatedPrice}</Text>
            </View>
          </View>

          {contract.clauses ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📝</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Clauses</Text>
                <Text style={styles.detailValue}>{contract.clauses}</Text>
              </View>
            </View>
          ) : null}

          {contract.schedule ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📋</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Échéancier</Text>
                <Text style={styles.detailValue}>{contract.schedule}</Text>
              </View>
            </View>
          ) : null}

          {contract.notes ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📋</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{contract.notes}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {canEdit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changer le statut</Text>
            <View style={styles.statusGrid}>
              {(Object.keys(STATUS_CONFIG) as ContractStatus[]).map((statusKey) => {
                const statusConf = STATUS_CONFIG[statusKey];
                return (
                  <Pressable
                    key={statusKey}
                    style={[
                      styles.statusButton,
                      contract.status === statusKey && styles.statusButtonActive,
                      { backgroundColor: contract.status === statusKey ? statusConf.bgColor : "#fff" },
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
              onPress={() => router.push(`/commercial/framework-contracts/${contract.id}/edit` as any)}
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
  contractNumber: { fontSize: 20, fontWeight: "800", color: GREEN, flex: 1, marginRight: 8 },
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
