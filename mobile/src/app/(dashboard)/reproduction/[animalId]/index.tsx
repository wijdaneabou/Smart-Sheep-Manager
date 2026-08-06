import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAnimalById, type Animal } from "../../../../services/animalsService";
import { reproductionService, ReproductionCycle } from "../../../../services/reproductionService";
import { matingService, MatingService } from "../../../../services/matingService";
import { getBreedInfo, getSexInfo } from "../../../../constants/breeds";
import { BackButton } from "../../../../components/BackButton";
import { usePermissions } from "@/contexts/PermissionsContext"; // 👈 NEW IMPORT

// ── Design tokens ──
const GREEN = "#14532d";
const GREEN_EMERALD = "#059669";
const BACKGROUND = "#f8fafc";
const CARD_BG = "#ffffff";
const BORDER = "#e5e7eb";
const TEXT_DARK = "#1f2937";
const TEXT_MUTED = "#6b7280";

// ── Composant principal ──
export default function AnimalCyclesScreen() {
  const { animalId } = useLocalSearchParams<{ animalId: string }>();
  const id = parseInt(animalId);
  const router = useRouter();
  const { hasPermission } = usePermissions(); // 👈 NEW

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [cycles, setCycles] = useState<ReproductionCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [matingServices, setMatingServices] = useState<MatingService[]>([]);
  const [loadingMating, setLoadingMating] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationDate, setConfirmationDate] = useState("");
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);

  async function loadData() {
    setError(null);
    try {
      const animalResult = await getAnimalById(id);
      if (!animalResult.success) {
        setError(animalResult.message);
        return;
      }
      setAnimal(animalResult.animal);

      const cyclesResult = await reproductionService.getCyclesByAnimal(id);
      setCycles(cyclesResult.data.data);
    } catch (err) {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMatingServices() {
    setLoadingMating(true);
    try {
      const res = await matingService.getByAnimal(id);
      setMatingServices(res.data.data);
    } catch (error) {
      console.error("Erreur chargement saillies", error);
    } finally {
      setLoadingMating(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
      loadMatingServices();
    }, [id])
  );

  function openConfirmModal(cycleId: number) {
    setSelectedCycleId(cycleId);
    setConfirmationDate("");
    setModalVisible(true);
  }

  async function handleConfirmSubmit() {
    if (!selectedCycleId) return;
    if (!confirmationDate) {
      Alert.alert("Erreur", "Veuillez saisir une date (YYYY-MM-DD).");
      return;
    }
    try {
      await reproductionService.confirmPregnancy(selectedCycleId, confirmationDate);
      setModalVisible(false);
      setSelectedCycleId(null);
      setConfirmationDate("");
      await loadData();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de confirmer la gestation.");
    }
  }

  function handleDelete(cycleId: number) {
    Alert.alert(
      "Supprimer le cycle",
      "Êtes-vous sûr ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await reproductionService.deleteCycle(cycleId);
              await loadData();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le cycle.");
            }
          },
        },
      ]
    );
  }

  function handleDeleteMating(matingId: number) {
    Alert.alert(
      "Supprimer la saillie",
      "Êtes-vous sûr ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await matingService.delete(matingId);
              await loadMatingServices();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la saillie.");
            }
          },
        },
      ]
    );
  }

  const handleEditPregnancy = (cycleId: number) => {
    router.push(`/reproduction/${id}/edit-pregnancy?cycleId=${cycleId}`);
  };

  const handleRecordLambing = (cycleId: number) => {
    router.push(`/reproduction/${id}/record-lambing?cycleId=${cycleId}`);
  };

  const goToPerformance = () => {
    router.push(`/reproduction/${id}/performance`);
  };

  const goToAddCycle = () => {
    router.push(`/reproduction/add?animalId=${id}`);
  };

  const goToAddMating = () => {
    router.push(`/reproduction/${id}/add-mating`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Suivi Reproduction</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN_EMERALD} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !animal) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Suivi Reproduction</Text>
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
  const lastCycle = cycles.length > 0 ? cycles[0] : null;
  const confirmedCount = cycles.filter(c => c.pregnancyConfirmed).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
        <Text style={styles.headerTitle}>Suivi Reproduction</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarIcon}>{breedInfo.icon}</Text>
            </View>
            <View style={styles.heroBadges}>
              <View style={[styles.heroBadge, { backgroundColor: "#dbeafe" }]}>
                <Text style={[styles.heroBadgeText, { color: "#2563eb" }]}>
                  {sexInfo.icon} {sexInfo.label}
                </Text>
              </View>
              <View style={[styles.heroBadge, { backgroundColor: "#dcfce7" }]}>
                <Text style={[styles.heroBadgeText, { color: GREEN }]}>
                  {breedInfo.label}
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
            icon="repeat"
            iconColor={GREEN}
            value={String(cycles.length)}
            label="Cycles"
          />
          <StatCard
            icon="checkmark-circle"
            iconColor={GREEN_EMERALD}
            value={String(confirmedCount)}
            label="Confirmés"
          />
          <StatCard
            icon="calendar"
            iconColor={GREEN}
            value={lastCycle ? new Date(lastCycle.heatDate).toLocaleDateString("fr-FR") : "—"}
            label="Dernier cycle"
          />
          <StatCard
            icon="time"
            iconColor={GREEN}
            value={lastCycle?.pregnancyConfirmed ? "Gestant" : "En attente"}
            label="Statut"
          />
        </View>

        {/* ── Actions ── */}
        <View style={styles.section}>
          <SectionTitle label="Actions" />
          <View style={styles.actionsGrid}>
            <ActionCard
              icon="stats-chart"
              iconBg="#EFF6FF"
              iconColor={GREEN}
              label="Performance"
              onPress={goToPerformance}
            />
            {/* 👇 Ajouter cycle - REPRODUCTION:CREATE */}
            {hasPermission('REPRODUCTION', 'CREATE') && (
              <ActionCard
                icon="add-circle"
                iconBg="#ECFDF5"
                iconColor={GREEN_EMERALD}
                label="Ajouter cycle"
                onPress={goToAddCycle}
              />
            )}
            {/* 👇 Ajouter saillie - REPRODUCTION:CREATE */}
            {hasPermission('REPRODUCTION', 'CREATE') && (
              <ActionCard
                icon="git-merge"
                iconBg="#F5F3FF"
                iconColor="#7c3aed"
                label="Ajouter saillie"
                onPress={goToAddMating}
              />
            )}
          </View>
        </View>

        {/* ── Liste des cycles ── */}
        <View style={styles.section}>
          <SectionTitle label="Tous les cycles" />
          {cycles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={TEXT_MUTED} />
              <Text style={styles.emptyText}>Aucun cycle enregistré</Text>
              {hasPermission('REPRODUCTION', 'CREATE') && (
                <Pressable
                  onPress={goToAddCycle}
                  style={styles.emptyButton}
                >
                  <Text style={styles.emptyButtonText}>Ajouter un premier cycle</Text>
                </Pressable>
              )}
            </View>
          ) : (
            cycles.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onConfirm={openConfirmModal}
                onDelete={handleDelete}
                onEditPregnancy={handleEditPregnancy}
                onRecordLambing={handleRecordLambing}
                canConfirm={hasPermission('REPRODUCTION', 'UPDATE')}
                canRecordLambing={hasPermission('REPRODUCTION', 'UPDATE')}
                canDelete={hasPermission('REPRODUCTION', 'DELETE')}
              />
            ))
          )}
        </View>

        {/* ── Liste des saillies ── */}
        <View style={styles.section}>
          <SectionTitle label="Saillies" />
          {loadingMating ? (
            <ActivityIndicator size="small" color={GREEN_EMERALD} />
          ) : matingServices.length === 0 ? (
            <Text style={styles.emptyText}>Aucune saillie enregistrée.</Text>
          ) : (
            <View style={styles.matingList}>
              {matingServices.map((mating) => (
                <MatingCard
                  key={mating.id}
                  mating={mating}
                  onDelete={() => handleDeleteMating(mating.id)}
                  onEdit={() => router.push(`/reproduction/${id}/edit-mating?matingId=${mating.id}`)}
                  canEdit={hasPermission('REPRODUCTION', 'UPDATE')}
                  canDelete={hasPermission('REPRODUCTION', 'DELETE')}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Modal de confirmation ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmer la gestation</Text>
            <Text style={styles.modalSubtitle}>
              Saisissez la date de confirmation (YYYY-MM-DD) :
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 2026-08-20"
              placeholderTextColor="#aaa"
              value={confirmationDate}
              onChangeText={setConfirmationDate}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmSubmit}
                style={styles.modalConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirmer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sous‑composants ─────────────────────────────────────────────

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

// 👇 ActionCard avec condition directe dans le parent (pas de prop visible)
function ActionCard({
  icon,
  iconBg,
  iconColor,
  label,
  onPress,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.actionIconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
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

// ── CycleCard ──
function CycleCard({
  cycle,
  onConfirm,
  onDelete,
  onEditPregnancy,
  onRecordLambing,
  canConfirm,
  canRecordLambing,
  canDelete,
}: {
  cycle: ReproductionCycle;
  onConfirm: (id: number) => void;
  onDelete: (id: number) => void;
  onEditPregnancy: (id: number) => void;
  onRecordLambing: (id: number) => void;
  canConfirm: boolean;
  canRecordLambing: boolean;
  canDelete: boolean;
}) {
  const heatDate = new Date(cycle.heatDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isConfirmed = cycle.pregnancyConfirmed;
  const confirmDate = cycle.confirmationDate
    ? new Date(cycle.confirmationDate).toLocaleDateString("fr-FR")
    : null;

  return (
    <View style={styles.cycleCard}>
      <View style={styles.cycleHeader}>
        <View style={styles.cycleDate}>
          <Ionicons name="calendar" size={16} color={GREEN} />
          <Text style={styles.cycleDateText}>{heatDate}</Text>
        </View>
        <View style={styles.cycleActions}>
          {/* 👇 Confirmer - REPRODUCTION:UPDATE */}
          {!isConfirmed && canConfirm && (
            <Pressable
              onPress={() => onConfirm(cycle.id)}
              style={[styles.actionButton, styles.confirmButton]}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
            </Pressable>
          )}
          {/* 👇 Mise bas - REPRODUCTION:UPDATE */}
          {isConfirmed && !cycle.lambingDate && canRecordLambing && (
            <Pressable
              onPress={() => onRecordLambing(cycle.id)}
              style={[styles.actionButton, styles.lambingButton]}
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
            </Pressable>
          )}
          {/* 👇 Supprimer cycle - REPRODUCTION:DELETE */}
          {canDelete && (
            <Pressable
              onPress={() => onDelete(cycle.id)}
              style={[styles.actionButton, styles.deleteButton]}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.cycleBody}>
        <View style={styles.cycleRow}>
          <Text style={styles.cycleLabel}>Type</Text>
          <Text style={styles.cycleValue}>
            {cycle.matingType === "natural" ? "🌿 Naturel" : "🧪 IA"}
          </Text>
        </View>
        {cycle.matingType === "natural" && cycle.maleId && (
          <View style={styles.cycleRow}>
            <Text style={styles.cycleLabel}>Mâle</Text>
            <Text style={styles.cycleValue}>ID {cycle.maleId}</Text>
          </View>
        )}
        {cycle.matingType === "ai" && cycle.semenReference && (
          <View style={styles.cycleRow}>
            <Text style={styles.cycleLabel}>Semence</Text>
            <Text style={styles.cycleValue}>{cycle.semenReference}</Text>
          </View>
        )}
        <View style={styles.cycleRow}>
          <Text style={styles.cycleLabel}>Statut</Text>
          <Text
            style={[
              styles.cycleStatus,
              isConfirmed ? styles.confirmedStatus : styles.pendingStatus,
            ]}
          >
            {isConfirmed ? "✅ Confirmé" : "⏳ En attente"}
            {confirmDate && ` (le ${confirmDate})`}
          </Text>
        </View>
        {cycle.notes && (
          <View style={styles.cycleRow}>
            <Text style={styles.cycleLabel}>Notes</Text>
            <Text style={styles.cycleNotes}>{cycle.notes}</Text>
          </View>
        )}

        {cycle.pregnancyConfirmed && (
          <PregnancyCard cycle={cycle} onEdit={() => onEditPregnancy(cycle.id)} />
        )}
      </View>
    </View>
  );
}

// ── PregnancyCard ──
function PregnancyCard({ cycle, onEdit }: { cycle: ReproductionCycle; onEdit: () => void }) {
  return (
    <View style={styles.pregnancyCard}>
      <View style={styles.pregnancyHeader}>
        <Text style={styles.pregnancyTitle}>🤰 Gestation</Text>
        <TouchableOpacity onPress={onEdit} style={styles.pregnancyEditButton}>
          <Ionicons name="pencil" size={18} color={GREEN_EMERALD} />
        </TouchableOpacity>
      </View>

      {cycle.expectedLambingDate && (
        <View style={styles.pregnancyRow}>
          <Text style={styles.pregnancyLabel}>Mise bas prévue</Text>
          <Text style={styles.pregnancyValue}>
            {new Date(cycle.expectedLambingDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      )}

      {cycle.ultrasoundNotes && (
        <View style={styles.pregnancyRow}>
          <Text style={styles.pregnancyLabel}>Échographie</Text>
          <Text style={styles.pregnancyNotes}>{cycle.ultrasoundNotes}</Text>
        </View>
      )}

      {cycle.lambingDate && (
        <View style={styles.pregnancyRow}>
          <Text style={styles.pregnancyLabel}>Mise bas réelle</Text>
          <Text style={styles.pregnancyValue}>
            {new Date(cycle.lambingDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      )}

      {cycle.lambingType && (
        <View style={styles.pregnancyRow}>
          <Text style={styles.pregnancyLabel}>Type</Text>
          <Text style={styles.pregnancyValue}>
            {cycle.lambingType === 'single' ? '🐑 Simple' : '🐑🐑 Multiple'}
          </Text>
        </View>
      )}

      {(cycle.liveBorn !== null || cycle.stillBorn !== null) && (
        <View style={styles.pregnancyRow}>
          <Text style={styles.pregnancyLabel}>Naissances</Text>
          <Text style={styles.pregnancyValue}>
            {cycle.liveBorn !== null ? `${cycle.liveBorn} vivant${cycle.liveBorn > 1 ? 's' : ''}` : ''}
            {cycle.liveBorn !== null && cycle.stillBorn !== null ? ' · ' : ''}
            {cycle.stillBorn !== null ? `${cycle.stillBorn} mort-né${cycle.stillBorn > 1 ? 's' : ''}` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── MatingCard ──
function MatingCard({
  mating,
  onDelete,
  onEdit,
  canEdit,
  canDelete,
}: {
  mating: MatingService;
  onDelete: () => void;
  onEdit: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const getResultColor = (result: string) => {
    switch (result) {
      case "success": return "#10B981";
      case "failure": return "#EF4444";
      default: return "#F59E0B";
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case "success": return "✅ Réussie";
      case "failure": return "❌ Échec";
      default: return "⏳ En attente";
    }
  };

  return (
    <View style={styles.matingCard}>
      <View style={styles.matingHeader}>
        <View style={styles.matingDate}>
          <Ionicons name="calendar" size={16} color={GREEN} />
          <Text style={styles.matingDateText}>
            {new Date(mating.serviceDate).toLocaleDateString("fr-FR")}
          </Text>
        </View>
        <View style={styles.matingBadge}>
          <Text style={[styles.matingBadgeText, { color: getResultColor(mating.result) }]}>
            {getResultLabel(mating.result)}
          </Text>
        </View>
      </View>

      <View style={styles.matingBody}>
        <View style={styles.matingRow}>
          <Text style={styles.matingLabel}>Type</Text>
          <Text style={styles.matingValue}>
            {mating.type === "natural" ? "🌿 Naturel" : "🧪 IA"}
          </Text>
        </View>

        {mating.type === "natural" && mating.maleId && (
          <View style={styles.matingRow}>
            <Text style={styles.matingLabel}>Mâle</Text>
            <Text style={styles.matingValue}>ID {mating.maleId}</Text>
          </View>
        )}

        {mating.type === "ai" && mating.semenReference && (
          <View style={styles.matingRow}>
            <Text style={styles.matingLabel}>Semence</Text>
            <Text style={styles.matingValue}>{mating.semenReference}</Text>
          </View>
        )}

        <View style={styles.matingRow}>
          <Text style={styles.matingLabel}>Service #</Text>
          <Text style={styles.matingValue}>{mating.serviceNumber}</Text>
        </View>

        {mating.notes && (
          <View style={styles.matingRow}>
            <Text style={styles.matingLabel}>Notes</Text>
            <Text style={styles.matingNotes}>{mating.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.matingActions}>
        {/* 👇 Modifier saillie - REPRODUCTION:UPDATE */}
        {canEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.matingActionButton}>
            <Ionicons name="pencil" size={18} color="#3B82F6" />
          </TouchableOpacity>
        )}
        {/* 👇 Supprimer saillie - REPRODUCTION:DELETE */}
        {canDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.matingActionButton}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { marginRight: 0 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT_DARK, flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  error: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  container: { padding: 16, paddingBottom: 32 },

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
  heroTop: { alignItems: "center", marginBottom: 12 },
  heroAvatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroAvatarIcon: { fontSize: 42 },
  heroBadges: { flexDirection: "row", gap: 8 },
  heroBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { fontSize: 12, fontWeight: "700" },
  heroName: { fontSize: 24, fontWeight: "800", color: GREEN, textAlign: "center" },
  heroRfid: { fontSize: 13, color: TEXT_MUTED, textAlign: "center" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
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
  statValue: { fontSize: 15, fontWeight: "700", color: TEXT_DARK },
  statLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: "600" },

  section: { marginBottom: 20 },
  sectionTitleContainer: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionBar: { width: 4, height: 18, backgroundColor: GREEN, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: TEXT_DARK },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
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
  actionCardPressed: { backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" },
  actionIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: "700", color: TEXT_DARK, textAlign: "center" },

  cycleCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: "hidden",
  },
  cycleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  cycleDate: { flexDirection: "row", alignItems: "center", gap: 6 },
  cycleDateText: { fontSize: 14, fontWeight: "600", color: TEXT_DARK },
  cycleActions: { flexDirection: "row", gap: 6 },
  actionButton: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  confirmButton: { backgroundColor: GREEN_EMERALD },
  lambingButton: { backgroundColor: "#8B5CF6" },
  deleteButton: { backgroundColor: "#dc2626" },
  cycleBody: { padding: 14, gap: 6 },
  cycleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cycleLabel: { fontSize: 13, color: TEXT_MUTED, fontWeight: "500" },
  cycleValue: { fontSize: 13, fontWeight: "600", color: TEXT_DARK },
  cycleStatus: { fontSize: 13, fontWeight: "600" },
  confirmedStatus: { color: GREEN_EMERALD },
  pendingStatus: { color: "#d97706" },
  cycleNotes: { fontSize: 13, color: TEXT_MUTED, fontStyle: "italic", flex: 1, textAlign: "right" },

  pregnancyCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  pregnancyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pregnancyTitle: { fontSize: 15, fontWeight: "700", color: GREEN },
  pregnancyEditButton: { padding: 4 },
  pregnancyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 3 },
  pregnancyLabel: { fontSize: 13, color: TEXT_MUTED, fontWeight: "500" },
  pregnancyValue: { fontSize: 13, fontWeight: "600", color: TEXT_DARK },
  pregnancyNotes: { fontSize: 13, fontStyle: "italic", color: TEXT_MUTED, flexShrink: 1, textAlign: "right" },

  matingList: { gap: 12 },
  matingCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  matingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  matingDate: { flexDirection: "row", alignItems: "center", gap: 6 },
  matingDateText: { fontSize: 14, fontWeight: "600", color: TEXT_DARK },
  matingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "#f3f4f6" },
  matingBadgeText: { fontSize: 12, fontWeight: "600" },
  matingBody: { gap: 4 },
  matingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  matingLabel: { fontSize: 13, color: TEXT_MUTED, fontWeight: "500" },
  matingValue: { fontSize: 13, fontWeight: "600", color: TEXT_DARK },
  matingNotes: { fontSize: 13, color: TEXT_MUTED, fontStyle: "italic", flexShrink: 1, textAlign: "right" },
  matingActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  matingActionButton: { padding: 4 },

  emptyContainer: { alignItems: "center", paddingVertical: 32, gap: 12 },
  emptyText: { textAlign: "center", color: TEXT_MUTED, marginTop: 8, fontSize: 14 },
  emptyButton: { backgroundColor: GREEN, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  emptyButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", width: "85%", borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: TEXT_DARK, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: TEXT_MUTED, marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16, color: TEXT_DARK },
  modalButtons: { flexDirection: "row", gap: 10 },
  modalCancel: { flex: 1, paddingVertical: 12, alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 10 },
  modalCancelText: { color: TEXT_MUTED, fontWeight: "600", fontSize: 14 },
  modalConfirm: { flex: 1, paddingVertical: 12, alignItems: "center", backgroundColor: GREEN_EMERALD, borderRadius: 10 },
  modalConfirmText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});