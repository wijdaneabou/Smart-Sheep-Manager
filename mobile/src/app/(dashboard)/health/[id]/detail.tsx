import { useCallback, useState } from "react";
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
import api from "../../../../services/api";
import { BackButton } from "../../../../components/BackButton";
import { usePermissions } from "@/contexts/PermissionsContext"; // 👈 NEW IMPORT

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

export default function HealthRecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordId = Number(id);
  const router = useRouter();
  const { hasPermission } = usePermissions(); // 👈 NEW

  const [record, setRecord] = useState<any>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTreatments, setLoadingTreatments] = useState(true);
  const [loadingVaccinations, setLoadingVaccinations] = useState(true);
  const [loadingInterventions, setLoadingInterventions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchRecord() {
    setError(null);
    try {
      const response = await api.get(`/health/records/${recordId}`);
      setRecord(response.data.data);
    } catch (err) {
      setError("Erreur de chargement");
      console.error(err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (error || !record) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "Dossier introuvable."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = statusConfig[record.status as HealthStatus] || { label: record.status, color: '#888', icon: '❓' };
  const severityInfo = record.severity ? severityConfig[record.severity as keyof typeof severityConfig] : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
        <Text style={styles.headerTitle}>Dossier médical</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* En-tête */}
        <View style={styles.recordHeader}>
          <Text style={styles.recordIcon}>🏥</Text>
          <Text style={styles.recordTitle}>Dossier #{record.id}</Text>
          <Text style={styles.recordSubtitle}>Animal #{record.animalId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "20" }]}>
            <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
              {statusInfo.icon} {statusInfo.label}
            </Text>
          </View>
          {severityInfo && (
            <View style={[styles.severityBadge, { backgroundColor: severityInfo.color + "20" }]}>
              <Text style={[styles.severityBadgeText, { color: severityInfo.color }]}>
                Gravité: {severityInfo.label}
              </Text>
            </View>
          )}
        </View>

        {/* 👇 Actions du dossier - HEALTH:UPDATE et HEALTH:DELETE */}
        <View style={styles.actionsRow}>
          {hasPermission('HEALTH', 'UPDATE') && (
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push(`/health/${record.id}/edit` as any)}
            >
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionLabel}>Modifier</Text>
            </Pressable>
          )}
          {hasPermission('HEALTH', 'DELETE') && (
            <Pressable
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <>
                  <Text style={styles.actionIcon}>🗑️</Text>
                  <Text style={[styles.actionLabel, { color: "#dc2626" }]}>Supprimer</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Détails du dossier */}
        <View style={styles.infoBlock}>
          <SectionTitle label="Informations" />
          <InfoRow label="Animal" value={`#${record.animalId}`} />
          <InfoRow label="Statut" value={statusInfo.label} />
          {record.symptoms && <InfoRow label="Symptômes" value={record.symptoms} />}
          {record.diagnosis && <InfoRow label="Diagnostic" value={record.diagnosis} />}
          {record.severity && <InfoRow label="Gravité" value={severityInfo?.label || record.severity} />}
          <InfoRow label="Créé le" value={new Date(record.createdAt).toLocaleDateString("fr-FR")} />
          <InfoRow label="Dernière mise à jour" value={new Date(record.updatedAt).toLocaleDateString("fr-FR")} last />
        </View>

        {/* ── TRAITEMENTS ── */}
        <View style={styles.treatmentsSection}>
          <View style={styles.treatmentsHeader}>
            <Text style={styles.sectionTitle}>Traitements</Text>
            {hasPermission('HEALTH', 'CREATE') && (
              <Pressable
                style={styles.addTreatmentButton}
                onPress={() => router.push(`/health/${record.id}/add-treatment` as any)}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addTreatmentButtonText}>Ajouter</Text>
              </Pressable>
            )}
          </View>

          {loadingTreatments ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : treatments.length === 0 ? (
            <View style={styles.emptyTreatments}>
              <Text style={styles.emptyTreatmentsText}>Aucun traitement prescrit</Text>
            </View>
          ) : (
            treatments.map((treatment) => (
              <View key={treatment.id} style={styles.treatmentCard}>
                <View style={styles.treatmentHeader}>
                  <Text style={styles.treatmentName}>{treatment.medicationName}</Text>
                  <View style={[
                    styles.treatmentStatusBadge,
                    { backgroundColor: treatment.administered ? '#16a34a20' : '#dc262620' }
                  ]}>
                    <Text style={[
                      styles.treatmentStatusText,
                      { color: treatment.administered ? '#16a34a' : '#dc2626' }
                    ]}>
                      {treatment.administered ? '✅ Administré' : '⏳ En cours'}
                    </Text>
                  </View>
                </View>
                <View style={styles.treatmentDetails}>
                  <Text style={styles.treatmentDetail}>
                    <Text style={styles.treatmentDetailLabel}>Dosage :</Text> {treatment.dosage}
                  </Text>
                  <Text style={styles.treatmentDetail}>
                    <Text style={styles.treatmentDetailLabel}>Fréquence :</Text> {frequencyLabels[treatment.frequency] || treatment.frequency}
                  </Text>
                  <Text style={styles.treatmentDetail}>
                    <Text style={styles.treatmentDetailLabel}>Voie :</Text> {routeLabels[treatment.route] || treatment.route}
                  </Text>
                  <Text style={styles.treatmentDetail}>
                    <Text style={styles.treatmentDetailLabel}>Début :</Text> {new Date(treatment.startDate).toLocaleDateString('fr-FR')}
                  </Text>
                  {treatment.endDate && (
                    <Text style={styles.treatmentDetail}>
                      <Text style={styles.treatmentDetailLabel}>Fin :</Text> {new Date(treatment.endDate).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                  {treatment.nextDoseDate && (
                    <Text style={styles.treatmentDetail}>
                      <Text style={styles.treatmentDetailLabel}>Prochaine dose :</Text> {new Date(treatment.nextDoseDate).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                  {treatment.notes && (
                    <Text style={styles.treatmentDetail}>
                      <Text style={styles.treatmentDetailLabel}>Notes :</Text> {treatment.notes}
                    </Text>
                  )}
                </View>
                {!treatment.administered && (
                  <Pressable
                    style={styles.administerButton}
                    onPress={() => handleAdministerTreatment(treatment.id)}
                  >
                    <Text style={styles.administerButtonText}>💉 Administrer maintenant</Text>
                  </Pressable>
                )}
                <View style={styles.treatmentActions}>
                  {hasPermission('HEALTH', 'UPDATE') && (
                    <Pressable
                      style={[styles.treatmentActionButton, styles.treatmentEditButton]}
                      onPress={() => router.push(`/health/${record.id}/edit-treatment?treatmentId=${treatment.id}` as any)}
                    >
                      <Text style={styles.treatmentActionText}>✏️ Modifier</Text>
                    </Pressable>
                  )}
                  {hasPermission('HEALTH', 'DELETE') && (
                    <Pressable
                      style={[styles.treatmentActionButton, styles.treatmentDeleteButton]}
                      onPress={() => handleDeleteTreatment(treatment.id)}
                    >
                      <Text style={[styles.treatmentActionText, { color: '#dc2626' }]}>🗑️ Supprimer</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── VACCINATIONS ── */}
        <View style={styles.vaccinationsSection}>
          <View style={styles.vaccinationsHeader}>
            <Text style={styles.sectionTitle}>Vaccinations</Text>
            {hasPermission('HEALTH', 'CREATE') && (
              <Pressable
                style={styles.addVaccinationButton}
                onPress={() => router.push(`/health/${record.id}/add-vaccination` as any)}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addVaccinationButtonText}>Ajouter</Text>
              </Pressable>
            )}
          </View>

          {loadingVaccinations ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : vaccinations.length === 0 ? (
            <View style={styles.emptyVaccinations}>
              <Text style={styles.emptyVaccinationsText}>Aucune vaccination enregistrée</Text>
            </View>
          ) : (
            vaccinations.map((vaccination) => (
              <View key={vaccination.id} style={styles.vaccinationCard}>
                <View style={styles.vaccinationHeader}>
                  <Text style={styles.vaccinationName}>{vaccination.vaccineType}</Text>
                  <View style={[
                    styles.vaccinationStatusBadge,
                    { backgroundColor: vaccination.status === 'DONE' ? '#16a34a20' : vaccination.status === 'OVERDUE' ? '#dc262620' : '#ca8a0420' }
                  ]}>
                    <Text style={[
                      styles.vaccinationStatusText,
                      { color: vaccination.status === 'DONE' ? '#16a34a' : vaccination.status === 'OVERDUE' ? '#dc2626' : '#ca8a04' }
                    ]}>
                      {vaccination.status === 'DONE' ? '✅ Effectué' : vaccination.status === 'OVERDUE' ? '⏰ En retard' : '⏳ En attente'}
                    </Text>
                  </View>
                </View>
                <View style={styles.vaccinationDetails}>
                  <Text style={styles.vaccinationDetail}>
                    <Text style={styles.vaccinationDetailLabel}>Date :</Text> {new Date(vaccination.date).toLocaleDateString('fr-FR')}
                  </Text>
                  {vaccination.boosterDate && (
                    <Text style={styles.vaccinationDetail}>
                      <Text style={styles.vaccinationDetailLabel}>Rappel :</Text> {new Date(vaccination.boosterDate).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                  {vaccination.batchNumber && (
                    <Text style={styles.vaccinationDetail}>
                      <Text style={styles.vaccinationDetailLabel}>Lot :</Text> {vaccination.batchNumber}
                    </Text>
                  )}
                  {vaccination.notes && (
                    <Text style={styles.vaccinationDetail}>
                      <Text style={styles.vaccinationDetailLabel}>Notes :</Text> {vaccination.notes}
                    </Text>
                  )}
                </View>
                {vaccination.status !== 'DONE' && (
                  <Pressable
                    style={styles.vaccinationAdministerButton}
                    onPress={() => handleAdministerVaccination(vaccination.id)}
                  >
                    <Text style={styles.vaccinationAdministerButtonText}>💉 Marquer comme effectué</Text>
                  </Pressable>
                )}
                <View style={styles.vaccinationActions}>
                  {hasPermission('HEALTH', 'UPDATE') && (
                    <Pressable
                      style={[styles.vaccinationActionButton, styles.vaccinationEditButton]}
                      onPress={() => router.push(`/health/${record.id}/edit-vaccination?vaccinationId=${vaccination.id}` as any)}
                    >
                      <Text style={styles.vaccinationActionText}>✏️ Modifier</Text>
                    </Pressable>
                  )}
                  {hasPermission('HEALTH', 'DELETE') && (
                    <Pressable
                      style={[styles.vaccinationActionButton, styles.vaccinationDeleteButton]}
                      onPress={() => handleDeleteVaccination(vaccination.id)}
                    >
                      <Text style={[styles.vaccinationActionText, { color: '#dc2626' }]}>🗑️ Supprimer</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── INTERVENTIONS VÉTÉRINAIRES ── */}
        <View style={styles.interventionsSection}>
          <View style={styles.interventionsHeader}>
            <Text style={styles.sectionTitle}>Interventions vétérinaires</Text>
            {hasPermission('HEALTH', 'CREATE') && (
              <Pressable
                style={styles.addInterventionButton}
                onPress={() => router.push(`/health/${record.id}/add-intervention` as any)}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addInterventionButtonText}>Ajouter</Text>
              </Pressable>
            )}
          </View>

          {loadingInterventions ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : interventions.length === 0 ? (
            <View style={styles.emptyInterventions}>
              <Text style={styles.emptyInterventionsText}>Aucune intervention enregistrée</Text>
            </View>
          ) : (
            interventions.map((intervention) => (
              <View key={intervention.id} style={styles.interventionCard}>
                <View style={styles.interventionHeader}>
                  <Text style={styles.interventionName}>
                    {interventionTypeLabels[intervention.type] || intervention.type}
                  </Text>
                  <View style={[
                    styles.interventionTypeBadge,
                    { backgroundColor: (interventionTypeColors[intervention.type] || '#888') + '20' }
                  ]}>
                    <Text style={[styles.interventionTypeText, { color: interventionTypeColors[intervention.type] || '#888' }]}>
                      {intervention.type}
                    </Text>
                  </View>
                </View>
                <View style={styles.interventionDetails}>
                  <Text style={styles.interventionDetail}>
                    <Text style={styles.interventionDetailLabel}>Date :</Text> {new Date(intervention.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {intervention.cost && (
                    <Text style={styles.interventionDetail}>
                      <Text style={styles.interventionDetailLabel}>Coût :</Text> {intervention.cost} MAD
                    </Text>
                  )}
                  {intervention.report && (
                    <Text style={styles.interventionDetail}>
                      <Text style={styles.interventionDetailLabel}>Rapport :</Text> {intervention.report}
                    </Text>
                  )}
                  <Text style={styles.interventionDetail}>
                    <Text style={styles.interventionDetailLabel}>Vétérinaire :</Text> ID #{intervention.performedBy}
                  </Text>
                </View>
                <View style={styles.interventionActions}>
                  {hasPermission('HEALTH', 'UPDATE') && (
                    <Pressable
                      style={[styles.interventionActionButton, styles.interventionEditButton]}
                      onPress={() => router.push(`/health/${record.id}/edit-intervention?interventionId=${intervention.id}` as any)}
                    >
                      <Text style={styles.interventionActionText}>✏️ Modifier</Text>
                    </Pressable>
                  )}
                  {hasPermission('HEALTH', 'DELETE') && (
                    <Pressable
                      style={[styles.interventionActionButton, styles.interventionDeleteButton]}
                      onPress={() => handleDeleteIntervention(intervention.id)}
                    >
                      <Text style={[styles.interventionActionText, { color: '#dc2626' }]}>🗑️ Supprimer</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composants réutilisables ──

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleContainer}>
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ── Styles ──
const PAGE_BG = "#faf3ea";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: { marginRight: 0 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#dc2626" },

  container: { padding: 20, paddingTop: 8 },

  recordHeader: { alignItems: "center", marginBottom: 20 },
  recordIcon: { fontSize: 48, marginBottom: 8 },
  recordTitle: { fontSize: 22, fontWeight: "800", color: "#0F2A1D" },
  recordSubtitle: { fontSize: 14, color: "#888", marginBottom: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  severityBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  severityBadgeText: { fontSize: 11, fontWeight: "600" },

  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  actionButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  actionButtonDanger: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  actionIcon: { fontSize: 16, marginBottom: 4 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#333" },

  infoBlock: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitleContainer: { borderBottomWidth: 1, borderBottomColor: "#f0f0f0", paddingBottom: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  infoLabel: { fontSize: 13, color: "#888" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#333" },

  // Traitements
  treatmentsSection: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  treatmentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
    marginBottom: 12,
  },
  addTreatmentButton: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  addTreatmentButtonText: { color: "#fff", fontWeight: "600", fontSize: 12, marginLeft: 4 },

  emptyTreatments: { alignItems: "center", paddingVertical: 20 },
  emptyTreatmentsText: { color: "#888", fontSize: 13 },

  treatmentCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  treatmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  treatmentName: { fontSize: 15, fontWeight: "700", color: "#0F2A1D" },
  treatmentStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  treatmentStatusText: { fontSize: 10, fontWeight: "600" },

  treatmentDetails: { marginTop: 4 },
  treatmentDetail: { fontSize: 12, color: "#555", marginVertical: 1 },
  treatmentDetailLabel: { fontWeight: "600", color: "#333" },

  administerButton: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  administerButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  treatmentActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  treatmentActionButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  treatmentEditButton: {
    backgroundColor: "#e5e7eb",
  },
  treatmentDeleteButton: {
    backgroundColor: "#fee2e2",
  },
  treatmentActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },

  // Vaccinations
  vaccinationsSection: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  vaccinationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
    marginBottom: 12,
  },
  addVaccinationButton: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  addVaccinationButtonText: { color: "#fff", fontWeight: "600", fontSize: 12, marginLeft: 4 },

  emptyVaccinations: { alignItems: "center", paddingVertical: 20 },
  emptyVaccinationsText: { color: "#888", fontSize: 13 },

  vaccinationCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  vaccinationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  vaccinationName: { fontSize: 15, fontWeight: "700", color: "#0F2A1D" },
  vaccinationStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  vaccinationStatusText: { fontSize: 10, fontWeight: "600" },

  vaccinationDetails: { marginTop: 4 },
  vaccinationDetail: { fontSize: 12, color: "#555", marginVertical: 1 },
  vaccinationDetailLabel: { fontWeight: "600", color: "#333" },

  vaccinationAdministerButton: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  vaccinationAdministerButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  vaccinationActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  vaccinationActionButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  vaccinationEditButton: {
    backgroundColor: "#e5e7eb",
  },
  vaccinationDeleteButton: {
    backgroundColor: "#fee2e2",
  },
  vaccinationActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },

  // Interventions vétérinaires
  interventionsSection: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  interventionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
    marginBottom: 12,
  },
  addInterventionButton: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  addInterventionButtonText: { color: "#fff", fontWeight: "600", fontSize: 12, marginLeft: 4 },

  emptyInterventions: { alignItems: "center", paddingVertical: 20 },
  emptyInterventionsText: { color: "#888", fontSize: 13 },

  interventionCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  interventionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  interventionName: { fontSize: 15, fontWeight: "700", color: "#0F2A1D" },
  interventionTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  interventionTypeText: { fontSize: 10, fontWeight: "600" },

  interventionDetails: { marginTop: 4 },
  interventionDetail: { fontSize: 12, color: "#555", marginVertical: 1 },
  interventionDetailLabel: { fontWeight: "600", color: "#333" },

  interventionActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  interventionActionButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  interventionEditButton: {
    backgroundColor: "#e5e7eb",
  },
  interventionDeleteButton: {
    backgroundColor: "#fee2e2",
  },
  interventionActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
});