import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getAnimalById,
  deleteAnimal,
  type Animal,
} from "../../../../services/animalsService";
import { exportAnimalHistoryPdf } from "../../../../services/animalHistoryService";
import { getBreedInfo, getSexInfo, getHealthStatusInfo } from "../../../../constants/breeds";
import { API_URL } from "../../../../services/api";
import { BackButton } from "../../../../components/BackButton";

// ── Design tokens ──────────────────────────────────────────────
const GREEN = "#14532d";
const GREEN_EMERALD = "#059669";
const BACKGROUND = "#f8fafc";
const CARD_BG = "#ffffff";
const BORDER = "#e5e7eb";
const TEXT_DARK = "#1f2937";
const TEXT_MUTED = "#6b7280";

// ── Helpers ────────────────────────────────────────────────────
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function calculateAge(birthDate: string | null): string {
  if (!birthDate) return "—";
  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  if (diffMs < 0) return "—";
  const ageDate = new Date(diffMs);
  const years = ageDate.getUTCFullYear() - 1970;
  const months = ageDate.getUTCMonth();
  if (years > 0) {
    return `${years}a${months > 0 ? ` ${months}m` : ""}`;
  }
  if (months > 0) {
    return `${months} mois`;
  }
  const days = ageDate.getUTCDate() - 1;
  return `${days}j`;
}

// ── Main component ─────────────────────────────────────────────
export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animalId = Number(id);
  const router = useRouter();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function fetchAnimal() {
    setError(null);
    const result = await getAnimalById(animalId);
    if (result.success) {
      setAnimal(result.animal);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAnimal().finally(() => setLoading(false));
    }, [animalId])
  );

  async function handleDelete() {
    Alert.alert(
      "Confirmer la suppression",
      `Êtes-vous sûr de vouloir supprimer ${animal?.name} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const result = await deleteAnimal(animalId);
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

  async function handleExport() {
    setExporting(true);
    const result = await exportAnimalHistoryPdf(animalId);
    setExporting(false);
    if (!result.success) {
      Alert.alert("Erreur", result.message);
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Fiche Animal</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN_EMERALD} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ──
  if (error || !animal) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Fiche Animal</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={48} color="#dc2626" />
          <Text style={styles.error}>{error ?? "Animal introuvable."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const breedInfo = getBreedInfo(animal.breed);
  const sexInfo = getSexInfo(animal.sex);
  const healthInfo = getHealthStatusInfo(animal.healthStatus);
  const photoUrl = animal.photoUrl
    ? animal.photoUrl.startsWith("http")
      ? animal.photoUrl
      : `${API_URL}${animal.photoUrl}`
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
        <Text style={styles.headerTitle}>Fiche Animal</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.heroPhoto} />
            ) : (
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarIcon}>{breedInfo.icon}</Text>
              </View>
            )}
            <View style={styles.heroBadges}>
              <View
                style={[
                  styles.heroBadge,
                  { backgroundColor: healthInfo.color + "20" },
                ]}
              >
                <Text style={[styles.heroBadgeText, { color: healthInfo.color }]}>
                  {healthInfo.icon} {healthInfo.label}
                </Text>
              </View>
              <View
                style={[
                  styles.heroBadge,
                  {
                    backgroundColor:
                      sexInfo.id === "MALE" ? "#dbeafe" : "#fce7f3",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.heroBadgeText,
                    { color: sexInfo.id === "MALE" ? "#2563eb" : "#db2777" },
                  ]}
                >
                  {sexInfo.icon} {sexInfo.label}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.heroName}>{animal.name}</Text>
          <Text style={styles.heroRfid}>{animal.rfid}</Text>
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="barbell"
            iconColor={GREEN}
            value={animal.weight ? `${animal.weight} kg` : "—"}
            label="Poids"
          />
          <StatCard
            icon="eye"
            iconColor={GREEN}
            value={animal.bcs ?? "—"}
            label="BCS"
          />
          <StatCard
            icon="calendar"
            iconColor={GREEN}
            value={calculateAge(animal.birthDate)}
            label="Âge"
          />
          <StatCard
            icon="body"
            iconColor={GREEN}
            value={breedInfo.label}
            label="Race"
          />
        </View>

        {/* ── Actions ── */}
        <View style={styles.section}>
          <SectionTitle label="Actions rapides" />
          <View style={styles.actionsGrid}>
            <ActionCard
              icon="create"
              iconBg="#EFF6FF"
              iconColor={GREEN}
              label="Modifier"
              onPress={() =>
                router.push(
                  {
                    pathname: "/herd/[id]/edit",
                    params: { id: String(animal.id) },
                  } as any
                )
              }
            />
            <ActionCard
              icon="list"
              iconBg="#F5F3FF"
              iconColor="#7c3aed"
              label="Historique"
              onPress={() => router.push(`/herd/${animal.id}/history` as any)}
            />
            <ActionCard
              icon="swap-horizontal"
              iconBg="#ECFEFF"
              iconColor="#0891B2"
              label="Mouvements"
              onPress={() =>
                router.push({
                  pathname: "/herd/movements",
                  params: {
                    animalId: String(animal.id),
                  },
                } as any)
              }
            />
            <ActionCard
              icon="analytics"
              iconBg="#ECFDF5"
              iconColor={GREEN_EMERALD}
              label="Croissance"
              onPress={() => router.push(`/herd/${animal.id}/growth` as any)}
            />
            <ActionCard
              icon="body"
              iconBg="#E6F8ED"
              iconColor="#0d9488"
              label="Radar BCS"
              onPress={() => router.push(`/herd/${animal.id}/bcs` as any)}
            />
            <ActionCard
              icon="git-branch"
              iconBg="#FFFBEB"
              iconColor="#d97706"
              label="Pedigree"
              onPress={() => router.push(`/herd/${animal.id}/pedigree` as any)}
            />
            <ActionCard
              icon="download"
              iconBg="#F0FDF4"
              iconColor={GREEN_EMERALD}
              label="Exporter"
              onPress={handleExport}
              loading={exporting}
            />
            <ActionCard
              icon="trash"
              iconBg="#FEE2E2"
              iconColor="#dc2626"
              label="Supprimer"
              onPress={handleDelete}
              loading={deleting}
              danger
            />
          </View>
        </View>

        {/* ── Identité ── */}
        <View style={styles.section}>
          <SectionTitle label="Identité" />
          <View style={styles.infoBlock}>
            <InfoRow label="RFID" value={animal.rfid} />
            <InfoRow label="Nom" value={animal.name} />
            <InfoRow label="Race" value={breedInfo.label} />
            <InfoRow label="Sexe" value={`${sexInfo.icon} ${sexInfo.label}`} />
            <InfoRow
              label="Statut santé"
              value={`${healthInfo.icon} ${healthInfo.label}`}
              last
            />
          </View>
        </View>

        {/* ── Caractéristiques ── */}
        <View style={styles.section}>
          <SectionTitle label="Caractéristiques" />
          <View style={styles.infoBlock}>
            <InfoRow label="Date de naissance" value={formatDate(animal.birthDate)} />
            <InfoRow
              label="Poids"
              value={animal.weight ? `${animal.weight} kg` : "—"}
            />
            <InfoRow label="BCS" value={animal.bcs ?? "—"} />
            <InfoRow label="Créé le" value={formatDate(animal.createdAt)} last />
          </View>
        </View>

        {/* ── Pedigree ── */}
        <View style={styles.section}>
          <SectionTitle label="Pedigree" />
          <View style={styles.infoBlock}>
            <InfoRow
              label="Père (ID)"
              value={animal.fatherId ? String(animal.fatherId) : "Non renseigné"}
            />
            <InfoRow
              label="Mère (ID)"
              value={animal.motherId ? String(animal.motherId) : "Non renseigné"}
            />
            <InfoRow
              label="Exploitation (ID)"
              value={
                animal.exploitationId
                  ? String(animal.exploitationId)
                  : "Non renseignée"
              }
              last
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────

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

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Layout ──
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_DARK,
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
    paddingBottom: 32,
  },

  // ── Hero Card ──
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
  heroPhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroAvatarIcon: {
    fontSize: 42,
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
    fontSize: 24,
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

  // ── Quick Stats ──
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

  // ── Section ──
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

  // ── Actions Grid ──
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

  // ── Info Block ──
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
});