import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { usePermissions } from "@/contexts/PermissionsContext";

import {
  getFatteningBatchById,
  updateFatteningBatch,
  type FatteningStatus,
} from "../../../../services/fatteningService";
import { listExploitations } from "../../../../services/exploitationservice";

const STATUSES: { id: FatteningStatus; label: string; color: string }[] = [
  { id: "ACTIVE", label: "En cours", color: "#15803D" },
  { id: "COMPLETED", label: "Terminé", color: "#1D4ED8" },
  { id: "CANCELLED", label: "Annulé", color: "#DC2626" },
];

export default function EditFatteningBatchScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasPermission } = usePermissions();

  // 🔒 Guard: if no UPDATE permission, show access denied and prevent editing
  const canEdit = hasPermission("FATTENING", "UPDATE");

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [animalCount, setAnimalCount] = useState("");
  const [initialAverageWeight, setInitialAverageWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetDailyGmq, setTargetDailyGmq] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<FatteningStatus>("ACTIVE");

  const [exploitationId, setExploitationId] = useState("");
  const [exploitations, setExploitations] = useState<any[]>([]);
  const [loadingExploitations, setLoadingExploitations] = useState(true);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🚫 If user is not allowed, show access denied and prevent further execution
  if (!canEdit) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Accès refusé</Text>
          <View style={styles.avatar}>
            <Ionicons name="lock-closed" size={16} color="#fff" />
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed" size={48} color="#ccc" />
          <Text style={styles.accessDeniedText}>
            Vous n'avez pas la permission de modifier ce lot.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>RETOUR</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Rest of the component (unchanged from your original code)...
  useEffect(() => {
    async function loadBatch() {
      if (!id) return;
      setLoading(true);
      const result = await getFatteningBatchById(Number(id));
      if (result.success && result.batch) {
        const b = result.batch;
        setName(b.name);
        setStartDate(b.startDate ? b.startDate.slice(0, 10) : "");
        setAnimalCount(String(b.animalCount));
        setInitialAverageWeight(b.initialAverageWeight);
        setTargetWeight(b.targetWeight);
        setTargetDailyGmq(b.targetDailyGmq || "");
        setEstimatedEndDate(
          b.estimatedEndDate ? b.estimatedEndDate.slice(0, 10) : ""
        );
        setNotes(b.notes || "");
        setStatus(b.status);
        setExploitationId(b.exploitationId ? String(b.exploitationId) : "");
      } else {
        setError(result.message || "Lot introuvable.");
      }
      setLoading(false);
    }
    loadBatch();
  }, [id]);

  useEffect(() => {
    async function loadExploitations() {
      setLoadingExploitations(true);
      try {
        const result = await listExploitations({ limit: 100 });
        if (result.success) {
          setExploitations(result.data);
        }
      } catch (err) {
        console.error("Erreur chargement exploitations:", err);
      } finally {
        setLoadingExploitations(false);
      }
    }
    loadExploitations();
  }, []);

  function validate(): string | null {
    if (name.trim().length < 1) return "Le nom du lot est requis.";
    if (!startDate) return "La date de début est requise.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return "Format de date invalide pour la date de début (YYYY-MM-DD).";
    }
    if (!animalCount || Number.isNaN(Number(animalCount)) || Number(animalCount) <= 0) {
      return "Le nombre d'animaux doit être un entier positif.";
    }
    if (!initialAverageWeight || Number.isNaN(Number(initialAverageWeight)) || Number(initialAverageWeight) <= 0) {
      return "Le poids initial doit être un nombre positif.";
    }
    if (!targetWeight || Number.isNaN(Number(targetWeight)) || Number(targetWeight) <= 0) {
      return "Le poids cible doit être un nombre positif.";
    }
    if (
      estimatedEndDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(estimatedEndDate)
    ) {
      return "Format de date invalide (YYYY-MM-DD).";
    }
    if (Number(targetWeight) <= Number(initialAverageWeight)) {
      return "Le poids cible doit être supérieur au poids initial.";
    }
    if (targetDailyGmq && (Number.isNaN(Number(targetDailyGmq)) || Number(targetDailyGmq) <= 0)) {
      return "Le GMQ cible doit être un nombre positif.";
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    const result = await updateFatteningBatch(Number(id), {
      name: name.trim(),
      startDate,
      animalCount: Number(animalCount),
      initialAverageWeight: Number(initialAverageWeight),
      targetWeight: Number(targetWeight),
      targetDailyGmq: targetDailyGmq ? Number(targetDailyGmq) : undefined,
      estimatedEndDate: estimatedEndDate || null,
      status,
      exploitationId: exploitationId ? Number(exploitationId) : null,
      notes: notes.trim() || null,
    });

    setSaving(false);

    if (result.success) {
      router.back();
    } else {
      setError(result.message);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Modifier le lot</Text>
          <View style={styles.avatar}>
            <Feather name="edit-2" size={14} color="#fff" />
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Modifier le lot</Text>
          <View style={styles.avatar}>
            <Feather name="edit-2" size={14} color="#fff" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Carte 1 — Informations générales */}
          <Card icon="document-text-outline" title="Informations générales">
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom du lot *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Lot Engraissement A"
                placeholderTextColor="#aaa"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Date de début *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#aaa"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.rowItem]}>
                <Text style={styles.label}>Nombre d'animaux *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : 20"
                  placeholderTextColor="#aaa"
                  keyboardType="number-pad"
                  value={animalCount}
                  onChangeText={setAnimalCount}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Statut</Text>
              <View style={styles.typeRow}>
                {STATUSES.map((s) => {
                  const selected = status === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => setStatus(s.id)}
                      style={[
                        styles.typeChip,
                        selected && { backgroundColor: s.color, borderColor: s.color },
                      ]}
                    >
                      <Text style={[styles.typeChipLabel, selected && { color: "#fff" }]}>
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Card>

          {/* Carte 2 — Poids & objectifs */}
          <Card icon="scale-outline" title="Poids & objectifs">
            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.rowItem]}>
                <Text style={styles.label}>Poids initial (kg) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : 25.00"
                  placeholderTextColor="#aaa"
                  keyboardType="decimal-pad"
                  value={initialAverageWeight}
                  onChangeText={setInitialAverageWeight}
                />
              </View>
              <View style={[styles.fieldGroup, styles.rowItem]}>
                <Text style={styles.label}>Poids cible (kg) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : 45.00"
                  placeholderTextColor="#aaa"
                  keyboardType="decimal-pad"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.rowItem]}>
                <Text style={styles.label}>GMQ cible (kg/j)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Auto si date de fin"
                  placeholderTextColor="#aaa"
                  keyboardType="decimal-pad"
                  value={targetDailyGmq}
                  onChangeText={setTargetDailyGmq}
                />
              </View>
              <View style={[styles.fieldGroup, styles.rowItem]}>
                <Text style={styles.label}>Date de fin prévisionnelle</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#aaa"
                  value={estimatedEndDate}
                  onChangeText={setEstimatedEndDate}
                />
              </View>
            </View>
          </Card>

          {/* Carte 3 — Exploitation */}
          <Card icon="business-outline" title="Exploitation">
            <Text style={styles.helperText}>
              Sélectionnez l'exploitation concernée par ce lot.
            </Text>

            {loadingExploitations ? (
              <ActivityIndicator size="small" color={GREEN} />
            ) : exploitations.length === 0 ? (
              <View style={styles.noExploitationBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                <Text style={styles.noExploitationText}>
                  Aucune exploitation disponible. Créez-en une d'abord.
                </Text>
              </View>
            ) : (
              <View style={styles.exploitationList}>
                {exploitations.map((exploitation) => {
                  const selected = exploitationId === String(exploitation.id);
                  return (
                    <Pressable
                      key={exploitation.id}
                      onPress={() => setExploitationId(String(exploitation.id))}
                      style={[
                        styles.exploitationOption,
                        selected && styles.exploitationOptionSelected,
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.exploitationName,
                            selected && styles.exploitationTextSelected,
                          ]}
                        >
                          {exploitation.name}
                        </Text>
                        <Text
                          style={[
                            styles.exploitationType,
                            selected && styles.exploitationTextSelected,
                          ]}
                        >
                          {exploitation.type || "Type non défini"}
                        </Text>
                      </View>
                      {selected && (
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Carte 4 — Notes */}
          <Card icon="create-outline" title="Notes">
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes sur le lot..."
              placeholderTextColor="#aaa"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </Card>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>ANNULER</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSubmit} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="save" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>ENREGISTRER</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name={icon} size={15} color={GREEN} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const GREEN = "#14532d";
const BG = "#faf6f1";
const CARD_BG = "#fff";
const BORDER = "#ECECE6";
const SOFT_GREEN = "#f5f5f0";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 16, paddingTop: 4, flexGrow: 1 },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  cardIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: SOFT_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937" },

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  helperText: { fontSize: 12, color: "#64748b", marginBottom: 12 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 14,
  },
  typeChipLabel: { fontSize: 12, fontWeight: "700", color: "#555" },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },

  exploitationList: { gap: 8 },
  exploitationOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  exploitationOptionSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  exploitationName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  exploitationType: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  exploitationTextSelected: {
    color: "#fff",
  },
  noExploitationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  noExploitationText: {
    color: "#dc2626",
    fontSize: 13,
    flex: 1,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    flex: 1,
  },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelButtonText: { color: "#444", fontWeight: "700", fontSize: 13 },
  button: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 12, textAlign: "center" },

  // Access denied screen
  accessDeniedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
