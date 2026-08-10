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
import api from "../../../../services/api";
import { BackButton } from "../../../../components/BackButton";
import { usePermissions } from "@/contexts/PermissionsContext";
import { API_URL } from "../../../../services/api";

// ── Design Tokens ──
const GREEN = "#14532d";
const GREEN_EMERALD = "#059669";
const BACKGROUND = "#f8fafc";
const CARD_BG = "#ffffff";
const BORDER = "#e5e7eb";
const TEXT_DARK = "#1f2937";
const TEXT_MUTED = "#6b7280";

// ── Types & Configs ──
type HealthStatus = 'HEALTHY' | 'SURVEILLANCE' | 'SICK' | 'UNDER_TREATMENT' | 'RECOVERED';

const statusConfig: Record<HealthStatus, { label: string; color: string; icon: string }> = {
  HEALTHY: { label: 'Sain', color: '#16a34a', icon: '✅' },
  SURVEILLANCE: { label: 'Surveillance', color: '#ca8a04', icon: '👀' },
  SICK: { label: 'Malade', color: '#dc2626', icon: '🤒' },
  UNDER_TREATMENT: { label: 'En traitement', color: '#ea580c', icon: '💊' },
  RECOVERED: { label: 'Rétabli', color: '#2563eb', icon: '💪' },
};

const severityConfig = {
  LOW: { label: 'Faible', color: '#16a34a' },
  MEDIUM: { label: 'Moyenne', color: '#ca8a04' },
  HIGH: { label: 'Élevée', color: '#ea580c' },
  CRITICAL: { label: 'Critique', color: '#dc2626' },
};

const frequencyLabels: Record<string, string> = {
  ONCE_DAILY: '1×/jour',
  TWICE_DAILY: '2×/jour',
  THREE_TIMES_DAILY: '3×/jour',
  WEEKLY: '1×/semaine',
  MONTHLY: '1×/mois',
};

const routeLabels: Record<string, string> = {
  ORAL: 'Oral',
  INTRAMUSCULAR: 'Intramusculaire',
  INTRAVENOUS: 'Intraveineux',
  SUBCUTANEOUS: 'Sous-cutané',
  TOPICAL: 'Topique',
};

const interventionTypeLabels: Record<string, string> = {
  CHECKUP: 'Check-up',
  SURGERY: 'Chirurgie',
  OBSTETRICS: 'Obstétrique',
  ULTRASOUND: 'Échographie',
  TREATMENT: 'Traitement',
  EMERGENCY: 'Urgence',
};

const interventionTypeColors: Record<string, string> = {
  CHECKUP: '#2563eb',
  SURGERY: '#dc2626',
  OBSTETRICS: '#7c3aed',
  ULTRASOUND: '#059669',
  TREATMENT: '#ea580c',
  EMERGENCY: '#dc2626',
};

// ── Main Component ──
export default function HealthRecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordId = Number(id);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // ── State ──
  const [record, setRecord] = useState<any>(null);
  const [animal, setAnimal] = useState<any>(null);
  const [animalLoading, setAnimalLoading] = useState(true);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTreatments, setLoadingTreatments] = useState(true);
  const [loadingVaccinations, setLoadingVaccinations] = useState(true);
  const [loadingInterventions, setLoadingInterventions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch Functions ──
  async function fetchRecord() {
    setError(null);
    try {
      const response = await api.get(`/health/records/${recordId}`);
      setRecord(response.data.data);
      // Fetch animal data
      await fetchAnimal(response.data.data.animalId);
    } catch (err) {
      setError("Erreur de chargement");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnimal(animalId: number) {
    setAnimalLoading(true);
    try {
      const response = await api.get(`/animals/${animalId}`);
      setAnimal(response.data.data);
    } catch (err) {
      console.error("Erreur chargement animal:", err);
    } finally {
      setAnimalLoading(false);
    }
  }

  async function fetchTreatments() {
    try {
      const response = await api.get(`/health/treatments/health-record/${recordId}`);
      setTreatments(response.data.data);
    } catch (err) {
      console.error("Erreur chargement traitements:", err);
    } finally {
      setLoadingTreatments(false);
    }
  }

  async function fetchVaccinations() {
    if (!record?.animalId) return;
    try {
      const response = await api.get(`/health/animals/${record.animalId}/vaccinations`);
      setVaccinations(response.data.data);
    } catch (err) {
      console.error("Erreur chargement vaccinations:", err);
    } finally {
      setLoadingVaccinations(false);
    }
  }

  async function fetchInterventions() {
    if (!record?.animalId) return;
    try {
      const response = await api.get(`/health/animals/${record.animalId}/interventions`);
      setInterventions(response.data.data);
    } catch (err) {
      console.error("Erreur chargement interventions:", err);
    } finally {
      setLoadingInterventions(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setLoadingTreatments(true);
      setLoadingVaccinations(true);
      setLoadingInterventions(true);
      fetchRecord();
      fetchTreatments();
      fetchVaccinations();
      fetchInterventions();
    }, [recordId])
  );

  // ── Handlers ──
  async function handleDelete() {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer ce dossier médical ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/health/records/${recordId}`);
              router.back();
            } catch (err) {
              Alert.alert("Erreur", "Échec de la suppression");
              console.error(err);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  async function handleAdministerTreatment(treatmentId: number) {
    try {
      await api.patch(`/health/treatments/${treatmentId}/administer`);
      Alert.alert("Succès", "Traitement administré");
      fetchTreatments();
    } catch (err) {
      Alert.alert("Erreur", "Échec de l'administration");
      console.error(err);
    }
  }

  async function handleDeleteTreatment(treatmentId: number) {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer ce traitement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/health/treatments/${treatmentId}`);
              Alert.alert("Succès", "Traitement supprimé");
              fetchTreatments();
            } catch (err) {
              Alert.alert("Erreur", "Échec de la suppression");
              console.error(err);
            }
          },
        },
      ]
    );
  }

  async function handleDeleteVaccination(vaccinationId: number) {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cette vaccination ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/health/vaccinations/${vaccinationId}`);
              Alert.alert("Succès", "Vaccination supprimée");
              fetchVaccinations();
            } catch (err) {
              Alert.alert("Erreur", "Échec de la suppression");
              console.error(err);
            }
          },
        },
      ]
    );
  }

  async function handleAdministerVaccination(vaccinationId: number) {
    try {
      await api.patch(`/health/vaccinations/${vaccinationId}/status`, { status: 'DONE' });
      Alert.alert("Succès", "Vaccination effectuée");
      fetchVaccinations();
    } catch (err) {
      Alert.alert("Erreur", "Échec de l'administration");
      console.error(err);
    }
  }

  async function handleDeleteIntervention(interventionId: number) {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cette intervention ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/health/interventions/${interventionId}`);
              Alert.alert("Succès", "Intervention supprimée");
              fetchInterventions();
            } catch (err) {
              Alert.alert("Erreur", "Échec de la suppression");
              console.error(err);
            }
          },
        },
      ]
    );
  }

  // ── Loading State ──
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Dossier médical</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN_EMERALD} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error State ──
  if (error || !record) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Dossier médical</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={48} color="#dc2626" />
          <Text style={styles.error}>{error ?? "Dossier introuvable."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = statusConfig[record.status as HealthStatus] || { label: record.status, color: '#888', icon: '❓' };
  const severityInfo = record.severity ? severityConfig[record.severity as keyof typeof severityConfig] : null;

  // ── Animal Photo URL ──
  const animalPhotoUrl = animal?.photoUrl
    ? animal.photoUrl.startsWith("http")
      ? animal.photoUrl
      : `${API_URL}${animal.photoUrl}`
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
        <Text style={styles.headerTitle}>Dossier médical</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Animal Profile Card (SAME AS HERD DETAIL) ── */}
        <Pressable
          style={styles.heroCard}
          onPress={() => router.push(`/herd/${record.animalId}/detail` as any)}
        >
          <View style={styles.heroTop}>
            {animalPhotoUrl ? (
              <Image source={{ uri: animalPhotoUrl }} style={styles.heroPhoto} />
            ) : (
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarIcon}>🐑</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{animal?.name || `Animal #${record.animalId}`}</Text>
          <Text style={styles.heroRfid}>{animal?.rfid || "RFID inconnu"}</Text>

          {/* Health status badge */}
          <View style={styles.heroBadges}>
            <View style={[styles.heroBadge, { backgroundColor: statusInfo.color + "20" }]}>
              <Text style={[styles.heroBadgeText, { color: statusInfo.color }]}>
                {statusInfo.icon} {statusInfo.label}
              </Text>
            </View>
            {severityInfo && (
              <View style={[styles.heroBadge, { backgroundColor: severityInfo.color + "20" }]}>
                <Text style={[styles.heroBadgeText, { color: severityInfo.color }]}>
                  Gravité: {severityInfo.label}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* ── Quick Stats ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="calendar"
            iconColor={GREEN}
            value={new Date(record.createdAt).toLocaleDateString("fr-FR")}
            label="Créé le"
          />
          <StatCard
            icon="time"
            iconColor={GREEN}
            value={new Date(record.updatedAt).toLocaleDateString("fr-FR")}
            label="Mise à jour"
          />
          <StatCard
            icon="medkit"
            iconColor={GREEN}
            value={statusInfo.label}
            label="Statut"
          />
        </View>

        {/* ── Actions ── */}
        <View style={styles.section}>
          <SectionTitle label="Actions" />
          <View style={styles.actionsGrid}>
            {hasPermission('HEALTH', 'UPDATE') && (
              <ActionCard
                icon="create"
                iconBg="#EFF6FF"
                iconColor={GREEN}
                label="Modifier"
                onPress={() => router.push(`/health/${record.id}/edit` as any)}
              />
            )}
            {hasPermission('HEALTH', 'DELETE') && (
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
            <InfoRow label="Dossier ID" value={`#${record.id}`} />
            <InfoRow label="Statut" value={statusInfo.label} />
            {record.symptoms && <InfoRow label="Symptômes" value={record.symptoms} />}
            {record.diagnosis && <InfoRow label="Diagnostic" value={record.diagnosis} />}
            {record.severity && <InfoRow label="Gravité" value={severityInfo?.label || record.severity} />}
            <InfoRow label="Créé le" value={new Date(record.createdAt).toLocaleDateString("fr-FR")} />
            <InfoRow label="Dernière mise à jour" value={new Date(record.updatedAt).toLocaleDateString("fr-FR")} last />
          </View>
        </View>

        {/* ── Traitements ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <SectionTitle label="Traitements" />
            {hasPermission('HEALTH', 'CREATE') && (
              <Pressable
                style={styles.addButton}
                onPress={() => router.push(`/health/${record.id}/add-treatment` as any)}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Ajouter</Text>
              </Pressable>
            )}
          </View>

          {loadingTreatments ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : treatments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun traitement prescrit</Text>
            </View>
          ) : (
            treatments.map((treatment) => (
              <TreatmentCard
                key={treatment.id}
                treatment={treatment}
                onAdminister={handleAdministerTreatment}
                onEdit={() => router.push(`/health/${record.id}/edit-treatment?treatmentId=${treatment.id}` as any)}
                onDelete={() => handleDeleteTreatment(treatment.id)}
                canUpdate={hasPermission('HEALTH', 'UPDATE')}
                canDelete={hasPermission('HEALTH', 'DELETE')}
              />
            ))
          )}
        </View>

        {/* ── Vaccinations ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <SectionTitle label="Vaccinations" />
            {hasPermission('HEALTH', 'CREATE') && (
              <Pressable
                style={styles.addButton}
                onPress={() => router.push(`/health/${record.id}/add-vaccination` as any)}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Ajouter</Text>
              </Pressable>
            )}
          </View>

          {loadingVaccinations ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : vaccinations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucune vaccination enregistrée</Text>
            </View>
          ) : (
            vaccinations.map((vaccination) => (
              <VaccinationCard
                key={vaccination.id}
                vaccination={vaccination}
                onAdminister={handleAdministerVaccination}
                onEdit={() => router.push(`/health/${record.id}/edit-vaccination?vaccinationId=${vaccination.id}` as any)}
                onDelete={() => handleDeleteVaccination(vaccination.id)}
                canUpdate={hasPermission('HEALTH', 'UPDATE')}
                canDelete={hasPermission('HEALTH', 'DELETE')}
              />
            ))
          )}
        </View>

        {/* ── Interventions vétérinaires ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <SectionTitle label="Interventions vétérinaires" />
            {hasPermission('HEALTH', 'CREATE') && (
              <Pressable
                style={styles.addButton}
                onPress={() => router.push(`/health/${record.id}/add-intervention` as any)}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Ajouter</Text>
              </Pressable>
            )}
          </View>

          {loadingInterventions ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : interventions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucune intervention enregistrée</Text>
            </View>
          ) : (
            interventions.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                onEdit={() => router.push(`/health/${record.id}/edit-intervention?interventionId=${intervention.id}` as any)}
                onDelete={() => handleDeleteIntervention(intervention.id)}
                canUpdate={hasPermission('HEALTH', 'UPDATE')}
                canDelete={hasPermission('HEALTH', 'DELETE')}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ──

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleContainer}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
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

function TreatmentCard({ treatment, onAdminister, onEdit, onDelete, canUpdate, canDelete }: any) {
  return (
    <View style={styles.subCard}>
      <View style={styles.subCardHeader}>
        <Text style={styles.subCardTitle}>{treatment.medicationName}</Text>
        <View style={[
          styles.subCardBadge,
          { backgroundColor: treatment.administered ? '#16a34a20' : '#dc262620' }
        ]}>
          <Text style={[
            styles.subCardBadgeText,
            { color: treatment.administered ? '#16a34a' : '#dc2626' }
          ]}>
            {treatment.administered ? '✅ Administré' : '⏳ En cours'}
          </Text>
        </View>
      </View>
      <View style={styles.subCardDetails}>
        <Text style={styles.subCardDetail}>
          <Text style={styles.subCardDetailLabel}>Dosage :</Text> {treatment.dosage}
        </Text>
        <Text style={styles.subCardDetail}>
          <Text style={styles.subCardDetailLabel}>Fréquence :</Text> {frequencyLabels[treatment.frequency] || treatment.frequency}
        </Text>
        <Text style={styles.subCardDetail}>
          <Text style={styles.subCardDetailLabel}>Voie :</Text> {routeLabels[treatment.route] || treatment.route}
        </Text>
        <Text style={styles.subCardDetail}>
          <Text style={styles.subCardDetailLabel}>Début :</Text> {new Date(treatment.startDate).toLocaleDateString('fr-FR')}
        </Text>
        {treatment.endDate && (
          <Text style={styles.subCardDetail}>
            <Text style={styles.subCardDetailLabel}>Fin :</Text> {new Date(treatment.endDate).toLocaleDateString('fr-FR')}
          </Text>
        )}
        {treatment.nextDoseDate && (
          <Text style={styles.subCardDetail}>
            <Text style={styles.subCardDetailLabel}>Prochaine dose :</Text> {new Date(treatment.nextDoseDate).toLocaleDateString('fr-FR')}
          </Text>
        )}
        {treatment.notes && (
          <Text style={styles.subCardDetail}>
            <Text style={styles.subCardDetailLabel}>Notes :</Text> {treatment.notes}
          </Text>
        )}
      </View>
      {!treatment.administered && (
        <Pressable
          style={styles.primaryActionButton}
          onPress={() => onAdminister(treatment.id)}
        >
          <Text style={styles.primaryActionButtonText}>💉 Administrer maintenant</Text>
        </Pressable>
      )}
      <View style={styles.subCardActions}>
        {canUpdate && (
          <Pressable
            style={[styles.subCardAction, styles.subCardActionEdit]}
            onPress={onEdit}
          >
            <Text style={styles.subCardActionText}>✏️ Modifier</Text>
          </Pressable>
        )}
        {canDelete && (
          <Pressable
            style={[styles.subCardAction, styles.subCardActionDelete]}
            onPress={onDelete}
          >
            <Text style={[styles.subCardActionText, { color: '#dc2626' }]}>🗑️ Supprimer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function VaccinationCard({ vaccination, onAdminister, onEdit, onDelete, canUpdate, canDelete }: any) {
  return (
    <View style={styles.subCard}>
      <View style={styles.subCardHeader}>
        <Text style={styles.subCardTitle}>{vaccination.vaccineType}</Text>
        <View style={[
          styles.subCardBadge,
          { backgroundColor: vaccination.status === 'DONE' ? '#16a34a20' : vaccination.status === 'OVERDUE' ? '#dc262620' : '#ca8a0420' }
        ]}>
          <Text style={[
            styles.subCardBadgeText,
            { color: vaccination.status === 'DONE' ? '#16a34a' : vaccination.status === 'OVERDUE' ? '#dc2626' : '#ca8a04' }
          ]}>
            {vaccination.status === 'DONE' ? '✅ Effectué' : vaccination.status === 'OVERDUE' ? '⏰ En retard' : '⏳ En attente'}
          </Text>
        </View>
      </View>
      <View style={styles.subCardDetails}>
        <Text style={styles.subCardDetail}>
          <Text style={styles.subCardDetailLabel}>Date :</Text> {new Date(vaccination.date).toLocaleDateString('fr-FR')}
        </Text>
        {vaccination.boosterDate && (
          <Text style={styles.subCardDetail}>
            <Text style={styles.subCardDetailLabel}>Rappel :</Text> {new Date(vaccination.boosterDate).toLocaleDateString('fr-FR')}
          </Text>
        )}
        {vaccination.batchNumber && (
          <Text style={styles.subCardDetail}>
            <Text style={styles.subCardDetailLabel}>Lot :</Text> {vaccination.batchNumber}
          </Text>
        )}
        {vaccination.notes && (
          <Text style={styles.subCardDetail}>
            <Text style={styles.subCardDetailLabel}>Notes :</Text> {vaccination.notes}
          </Text>
        )}
      </View>
      {vaccination.status !== 'DONE' && (
        <Pressable
          style={styles.primaryActionButton}
          onPress={() => onAdminister(vaccination.id)}
        >
          <Text style={styles.primaryActionButtonText}>💉 Marquer comme effectué</Text>
        </Pressable>
      )}
      <View style={styles.subCardActions}>
        {canUpdate && (
          <Pressable
            style={[styles.subCardAction, styles.subCardActionEdit]}
            onPress={onEdit}
          >
            <Text style={styles.subCardActionText}>✏️ Modifier</Text>
          </Pressable>
        )}
        {canDelete && (
          <Pressable
            style={[styles.subCardAction, styles.subCardActionDelete]}
            onPress={onDelete}
          >
            <Text style={[styles.subCardActionText, { color: '#dc2626' }]}>🗑️ Supprimer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function InterventionCard({ intervention, onEdit, onDelete, canUpdate, canDelete }: any) {
  return (
    <View style={styles.subCard}>
      <View style={styles.subCardHeader}>
        <Text style={styles.subCardTitle}>
          {interventionTypeLabels[intervention.type] || intervention.type}
        </Text>
        <View style={[
          styles.subCardBadge,
          { backgroundColor: (interventionTypeColors[intervention.type] || '#888') + '20' }
        ]}>
          <Text style={[styles.subCardBadgeText, { color: interventionTypeColors[intervention.type] || '#888' }]}>
            {intervention.type}
          </Text>
        </View>
      </View>
      <View style={styles.subCardDetails}>
        <Text style={styles.subCardDetail}>
          <Text style={styles.subCardDetailLabel}>Date :</Text> {new Date(intervention.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
        {intervention.cost && (
          <Text style={styles.subCardDetail}>
            <Text style={styles.subCardDetailLabel}>Coût :</Text> {intervention.cost} MAD
          </Text>
        )}
        {intervention.report && (
          <Text style={styles.subCardDetail}>
            <Text style={styles.subCardDetailLabel}>Rapport :</Text> {intervention.report}
          </Text>
        )}
        <Text style={styles.subCardDetail}>
          <Text style={styles.subCardDetailLabel}>Vétérinaire :</Text> ID #{intervention.performedBy}
        </Text>
      </View>
      <View style={styles.subCardActions}>
        {canUpdate && (
          <Pressable
            style={[styles.subCardAction, styles.subCardActionEdit]}
            onPress={onEdit}
          >
            <Text style={styles.subCardActionText}>✏️ Modifier</Text>
          </Pressable>
        )}
        {canDelete && (
          <Pressable
            style={[styles.subCardAction, styles.subCardActionDelete]}
            onPress={onDelete}
          >
            <Text style={[styles.subCardActionText, { color: '#dc2626' }]}>🗑️ Supprimer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { marginRight: 0 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT_DARK },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  error: { color: "#dc2626", fontSize: 14, textAlign: "center" },

  container: { padding: 16, paddingBottom: 32 },

  // ── Hero Card (Animal Profile) ──
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
  heroPhoto: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroAvatarIcon: { fontSize: 42 },
  heroName: { fontSize: 24, fontWeight: "800", color: GREEN, textAlign: "center", marginBottom: 4 },
  heroRfid: { fontSize: 13, color: TEXT_MUTED, textAlign: "center", marginBottom: 8 },
  heroBadges: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  heroBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { fontSize: 12, fontWeight: "700" },

  // ── Quick Stats ──
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
  statValue: { fontSize: 12, fontWeight: "700", color: TEXT_DARK, textAlign: "center" },
  statLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: "600", textAlign: "center" },

  // ── Section ──
  section: { marginBottom: 20 },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionBar: { width: 4, height: 18, backgroundColor: GREEN, borderRadius: 2, marginRight: 8 },
  sectionTitleText: { fontSize: 15, fontWeight: "700", color: TEXT_DARK, flex: 1 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // ── Add Button ──
  addButton: {
    flexDirection: "row",
    backgroundColor: GREEN_EMERALD,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 12, marginLeft: 4 },

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
  actionCardDanger: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  actionCardPressed: { backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: { fontSize: 12, fontWeight: "700", color: TEXT_DARK, textAlign: "center" },

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
  infoLabel: { fontSize: 13, color: TEXT_MUTED, fontWeight: "500" },
  infoValue: { fontSize: 13, fontWeight: "600", color: TEXT_DARK, textAlign: "right", flex: 1, marginLeft: 12 },

  // ── Sub Cards ──
  subCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  subCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  subCardTitle: { fontSize: 15, fontWeight: "700", color: TEXT_DARK, flex: 1, marginRight: 8 },
  subCardBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  subCardBadgeText: { fontSize: 10, fontWeight: "600" },
  subCardDetails: { marginTop: 2 },
  subCardDetail: { fontSize: 12, color: "#555", marginVertical: 1 },
  subCardDetailLabel: { fontWeight: "600", color: "#333" },
  subCardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  subCardAction: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  subCardActionEdit: { backgroundColor: "#e5e7eb" },
  subCardActionDelete: { backgroundColor: "#fee2e2" },
  subCardActionText: { fontSize: 12, fontWeight: "600", color: "#333" },

  // ── Primary Action Buttons ──
  primaryActionButton: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  primaryActionButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  // ── Empty State ──
  emptyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "dashed",
  },
  emptyText: { color: TEXT_MUTED, fontSize: 13 },
});