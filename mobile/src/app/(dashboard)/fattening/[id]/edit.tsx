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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";

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

  useEffect(() => {
    async function loadBatch() {
      if (!id) return;
      setLoading(true);
      const result = await getFatteningBatchById(Number(id));
      if (result.success && result.batch) {
        const b = result.batch;
      setName(b.name);
      // FIX : on ne garde que la partie YYYY-MM-DD, le backend renvoie une date-heure ISO complète
      setStartDate(b.startDate ? b.startDate.slice(0, 10) : "");
      setAnimalCount(String(b.animalCount));
      setInitialAverageWeight(b.initialAverageWeight);
      setTargetWeight(b.targetWeight);
      setTargetDailyGmq(b.targetDailyGmq || "");
      setEstimatedEndDate(b.estimatedEndDate || "");
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
    // FIX : on vérifie que la date de début est bien au format YYYY-MM-DD avant l'envoi
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
            <Ionicons name="arrow-back" size={22} color="#14532d" />
          </Pressable>
          <Text style={styles.headerTitle}>Modifier le lot</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#15803D" />
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
            <Ionicons name="arrow-back" size={22} color="#14532d" />
          </Pressable>
          <Text style={styles.headerTitle}>Modifier le lot</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <SectionTitle index={1} label="Informations générales" />

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
            <View style={[styles.fieldGroup, styles.rowItem]}>
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
          </View>

          <SectionTitle index={2} label="Poids" />

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.label}>Poids moyen initial (kg) *</Text>
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
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Date de fin prévisionnelle</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (optionnel)"
              placeholderTextColor="#aaa"
              value={estimatedEndDate}
              onChangeText={setEstimatedEndDate}
            />
          </View>

          <SectionTitle index={3} label="Exploitation" />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Exploitation</Text>
            {loadingExploitations ? (
              <ActivityIndicator size="small" color={GREEN} />
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
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <SectionTitle index={4} label="Notes" />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notes (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes sur le lot..."
              placeholderTextColor="#aaa"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

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

function SectionTitle({ index, label }: { index: number; label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>
        {index}. {label}
      </Text>
    </View>
  );
}

const GREEN = "#14532d";
const BORDER = "#e5e0d8";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#faf6f1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, paddingTop: 4, flexGrow: 1 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 12 },
  sectionBar: { width: 4, height: 14, backgroundColor: GREEN, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937" },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
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
  typeChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  typeChipIcon: { fontSize: 18, marginBottom: 4, color: "#555" },
  typeChipLabel: { fontSize: 12, fontWeight: "700", color: "#555" },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },

  exploitationList: { gap: 8 },
  exploitationOption: {
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

  error: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
  },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
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
});