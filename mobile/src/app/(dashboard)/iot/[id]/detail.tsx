import { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getIotShieldById,
  deleteIotShield,
  toggleShieldStatus,
  associateAnimalToShield,
  type IotShield,
} from "../../../../services/iotShieldsService";
import { getSensorTypeInfo, getShieldStatusInfo, formatSensorsList } from "../../../../constants/iot";
import { BackButton } from "../../../../components/BackButton";
import { usePermissions } from "../../../../contexts/PermissionsContext";

const GREEN = "#14532d";
const GREEN_EMERALD = "#059669";
const BACKGROUND = "#f8fafc";
const CARD_BG = "#ffffff";
const BORDER = "#e5e7eb";
const TEXT_DARK = "#1f2937";
const TEXT_MUTED = "#6b7280";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function getBatteryColor(battery: string): string {
  const num = parseFloat(battery);
  if (num > 50) return "#16a34a";
  if (num > 20) return "#f59e0b";
  return "#dc2626";
}

export default function IotShieldDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shieldId = Number(id);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (!hasPermission('IOT', 'SHIELDS:READ')) {
      router.replace("/iot");
    }
  }, [hasPermission, router]);

  const [shield, setShield] = useState<IotShield | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const canUpdate = hasPermission('IOT', 'SHIELDS:UPDATE');
  const canDelete = hasPermission('IOT', 'SHIELDS:DELETE');

  async function fetchShield() {
    setError(null);
    const result = await getIotShieldById(shieldId);
    if (result.success) {
      setShield(result.shield);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchShield().finally(() => setLoading(false));
    }, [shieldId])
  );

  async function handleDelete() {
    Alert.alert(
      "Confirmer la suppression",
      `Êtes-vous sûr de vouloir supprimer le bouclier ${shield?.ssmIotNumber} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const result = await deleteIotShield(shieldId);
            setDeleting(false);
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

  async function handleToggleStatus() {
    setToggling(true);
    const result = await toggleShieldStatus(shieldId);
    setToggling(false);
    if (result.success) {
      setShield(result.shield);
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  async function handleAssociateAnimal() {
    if (!shield) return;

    if (shield.animalId) {
      const animalName = shield.animal?.name ?? "cet animal";
      Alert.alert(
        "Dissocier l'animal",
        `Dissocier ${animalName} du bouclier ${shield.ssmIotNumber} ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Dissocier",
            style: "destructive",
            onPress: async () => {
              const result = await associateAnimalToShield(shieldId, null);
              if (result.success) {
                setShield(result.shield);
              } else {
                Alert.alert("Erreur", result.message);
              }
            },
          },
        ]
      );
    } else {
      Alert.prompt(
        "Associer un animal",
        "Entrez l'ID de l'animal à associer :",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Associer",
            onPress: async (animalIdStr: string | undefined) => {
              if (!animalIdStr) return;
              const animalId = Number(animalIdStr);
              if (Number.isNaN(animalId) || animalId <= 0) {
                Alert.alert("Erreur", "ID animal invalide.");
                return;
              }
              const result = await associateAnimalToShield(shieldId, animalId);
              if (result.success) {
                setShield(result.shield);
              } else {
                Alert.alert("Erreur", result.message);
              }
            },
          },
        ],
        "plain-text"
      );
    }
  }

  if (loading) {
    return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
      </View>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GREEN_EMERALD} />
      </View>
    </SafeAreaView>
    );
  }

  if (error || !shield) {
    return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
      </View>
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#dc2626" />
        <Text style={styles.error}>{error ?? "Bouclier introuvable."}</Text>
      </View>
    </SafeAreaView>
    );
  }

  const statusInfo = getShieldStatusInfo(shield.status);
  const batteryColor = getBatteryColor(shield.battery);
  const sensorsLabel = formatSensorsList(shield.sensors);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroAvatar}>
              <Ionicons name="wifi" size={28} color="#fff" />
            </View>
            <View style={styles.heroBadges}>
              <View
                style={[
                  styles.heroBadge,
                  { backgroundColor: statusInfo.color + "20" },
                ]}
              >
                <Text style={[styles.heroBadgeText, { color: statusInfo.color }]}>
                  {statusInfo.icon} {statusInfo.label}
                </Text>
              </View>
              <View
                style={[
                  styles.heroBadge,
                  { backgroundColor: batteryColor + "20" },
                ]}
              >
                <Text style={[styles.heroBadgeText, { color: batteryColor }]}>
                  🔋 {shield.battery}%
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.heroName}>{shield.ssmIotNumber}</Text>
          <Text style={styles.heroRfid}>{sensorsLabel}</Text>
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="battery"
            iconColor={batteryColor}
            value={`${shield.battery}%`}
            label="Batterie"
          />
          <StatCard
            icon="hardware-chip"
            iconColor={GREEN}
            value={String(shield.sensors.length)}
            label="Capteur(s)"
          />
          <StatCard
            icon="checkmark-circle"
            iconColor={statusInfo.color}
            value={statusInfo.label}
            label="Statut"
          />
          <StatCard
            icon="calendar"
            iconColor={GREEN}
            value={formatDate(shield.createdAt)}
            label="Créé le"
          />
        </View>

        {/* ── Actions ── */}
        <View style={styles.section}>
          <SectionTitle label="Actions rapides" />
          <View style={styles.actionsGrid}>
            {canUpdate && (
              <ActionCard
                icon="create"
                iconBg="#EFF6FF"
                iconColor={GREEN}
                label="Modifier"
                onPress={() =>
                  router.push({
                    pathname: "/iot/[id]/edit",
                    params: { id: String(shield.id) },
                  } as any)
                }
              />
            )}
            {canUpdate && (
              <ActionCard
                icon={shield.animalId ? "person-remove" : "person-add"}
                iconBg="#F5F3FF"
                iconColor="#7c3aed"
                label={shield.animalId ? "Dissocier" : "Associer"}
                onPress={handleAssociateAnimal}
              />
            )}
            {canUpdate && (
              <ActionCard
                icon={shield.status === "ACTIVE" ? "pause-circle" : "play-circle"}
                iconBg="#ECFEFF"
                iconColor={GREEN_EMERALD}
                label={shield.status === "ACTIVE" ? "Désactiver" : "Activer"}
                onPress={handleToggleStatus}
                loading={toggling}
              />
            )}
            {canDelete && (
              <ActionCard
                icon="trash"
                iconBg="#FEE2E2"
                iconColor="#dc2626"
                label="Supprimer"
                onPress={handleDelete}
                loading={deleting}
                danger
              />
            )}
          </View>
        </View>

        {/* ── Informations ── */}
        <View style={styles.section}>
          <SectionTitle label="Informations" />
          <View style={styles.infoBlock}>
            <InfoRow label="Numéro SSM-IOT" value={shield.ssmIotNumber} />
            <InfoRow label="Capteurs" value={sensorsLabel} />
            <InfoRow
              label="Batterie"
              value={`${shield.battery}%`}
              last={false}
            />
            <InfoRow
              label="Statut"
              value={`${statusInfo.icon} ${statusInfo.label}`}
              last
            />
          </View>
        </View>

        {/* ── Animal associé ── */}
        <View style={styles.section}>
          <SectionTitle label="Animal associé" />
          <View style={styles.infoBlock}>
            {shield.animal ? (
              <>
                <InfoRow label="Nom" value={shield.animal.name} />
                <InfoRow label="RFID" value={shield.animal.rfid} />
                <InfoRow label="Race" value={shield.animal.breed} />
                <InfoRow
                  label="Sexe"
                  value={shield.animal.sex === "MALE" ? "Mâle" : "Femelle"}
                  last
                />
              </>
            ) : (
              <Text style={styles.emptyAnimal}>
                Aucun animal n'est associé à ce bouclier.
              </Text>
            )}
          </View>
        </View>

        {/* ── Exploitation ── */}
        <View style={styles.section}>
          <SectionTitle label="Exploitation" />
          <View style={styles.infoBlock}>
            <InfoRow
              label="ID"
              value={shield.exploitationId ? String(shield.exploitationId) : "Non renseignée"}
            />
            <InfoRow
              label="Nom"
              value={shield.exploitation?.name ?? "—"}
              last
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={18} color={iconColor} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({
  icon,
  iconBg,
  iconColor,
  label,
  onPress,
  loading,
  danger,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  onPress: () => void;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        danger && styles.actionCardDanger,
        pressed && styles.actionCardPressed,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={[styles.actionIconCircle, { backgroundColor: iconBg }]}>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Ionicons name={icon as any} size={20} color={iconColor} />
        )}
      </View>
      <Text style={[styles.actionLabel, danger && { color: "#dc2626" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleContainer}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 0,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  container: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },

  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTop: {
    alignItems: "center",
    marginBottom: 12,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 8,
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    color: GREEN,
    textAlign: "center",
    marginBottom: 4,
  },
  heroRfid: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: "center",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT_DARK,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: "600",
  },

  section: {
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionBar: {
    width: 4,
    height: 18,
    backgroundColor: GREEN,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT_DARK,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  actionCard: {
    width: "30%",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionCardDanger: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  actionCardPressed: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: TEXT_DARK,
    textAlign: "center",
  },

  infoBlock: {
    width: "100%",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_DARK,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  emptyAnimal: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: "center",
    paddingVertical: 12,
  },
});
