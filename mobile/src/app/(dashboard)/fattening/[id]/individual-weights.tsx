import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";

import {
  listIndividualWeights,
  createIndividualWeight,
  deleteIndividualWeight,
  getFatteningBatchById,
  type FatteningBatchIndividualWeight,
  type FatteningBatch,
} from "../../../../services/fatteningService";
import { BackButton } from "../../../../components/BackButton";

const GREEN = "#14532d";

export default function BatchIndividualWeightsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const batchId = Number(id);

  const [batch, setBatch] = useState<FatteningBatch | null>(null);
  const [weights, setWeights] = useState<FatteningBatchIndividualWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWeights, setLoadingWeights] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [animalId, setAnimalId] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadBatch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await getFatteningBatchById(Number(id));
    if (result.success) {
      setBatch(result.batch);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, [id]);

  const loadWeights = useCallback(async () => {
    setLoadingWeights(true);
    const result = await listIndividualWeights(batchId);
    if (result.success) {
      setWeights(result.records);
    } else {
      setError(result.message);
    }
    setLoadingWeights(false);
  }, [batchId]);

  useFocusEffect(
    useCallback(() => {
      loadBatch();
      loadWeights();
    }, [loadBatch, loadWeights])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadWeights();
    setRefreshing(false);
  }

  function validate(): string | null {
    if (!date) return "La date est requise.";
    if (!weight || Number.isNaN(Number(weight)) || Number(weight) <= 0) {
      return "Le poids doit être un nombre positif.";
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      Alert.alert("Erreur", validationError);
      return;
    }

    setSubmitting(true);
    const result = await createIndividualWeight({
      fatteningBatchId: batchId,
      animalId: animalId ? Number(animalId) : null,
      weight: Number(weight),
      date,
      note: note || null,
    });
    setSubmitting(false);

    if (result.success) {
      setWeights((prev) => [result.record as any, ...prev]);
      setAnimalId("");
      setWeight("");
      setNote("");
      setShowAddForm(false);
      Alert.alert("Succès", "Poids individuel enregistré.");
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  async function handleDelete(record: FatteningBatchIndividualWeight) {
    Alert.alert(
      "Supprimer",
      `Êtes-vous sûr de vouloir supprimer cet enregistrement ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await deleteIndividualWeight(record.id);
            if (result.success) {
              setWeights((prev) => prev.filter((r) => r.id !== record.id));
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  function computeStats(): { stdDev: number; mean: number; min: number; max: number; cv: number } | null {
    if (weights.length < 2) return null;
    const values = weights.map((w) => Number(w.weight));
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
    const stdDev = Math.sqrt(variance);
    return {
      stdDev,
      mean,
      min: Math.min(...values),
      max: Math.max(...values),
      cv: (stdDev / mean) * 100,
    };
  }

  const stats = computeStats();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Poids individuels</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !batch) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Poids individuels</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || "Lot introuvable."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
        <Text style={styles.headerTitle}>Poids individuels — {batch.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Statistiques d'homogénéité</Text>
            <View style={styles.statsGrid}>
              <StatBox label="Écart-type (σ)" value={`${stats.stdDev.toFixed(2)} kg`} />
              <StatBox label="Moyenne" value={`${stats.mean.toFixed(2)} kg`} />
              <StatBox label="CV" value={`${stats.cv.toFixed(1)}%`} />
              <StatBox label="Min / Max" value={`${stats.min.toFixed(1)} / ${stats.max.toFixed(1)} kg`} />
            </View>
          </View>
        )}

        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Feather name={showAddForm ? "minus" : "plus"} size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>
            {showAddForm ? "Masquer le formulaire" : "AJOUTER UN ENREGISTREMENT"}
          </Text>
        </Pressable>

        {showAddForm && (
          <View style={styles.formCard}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
            />

            <Text style={styles.label}>ID animal (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 12"
              keyboardType="numeric"
              value={animalId}
              onChangeText={setAnimalId}
            />

            <Text style={styles.label}>Poids (kg) *</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 32.50"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
            />

            <Text style={styles.label}>Note (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Note..."
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.formActions}>
              <Pressable
                style={styles.cancelFormButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelFormButtonText}>ANNULER</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>ENREGISTRER</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.recordsSection}>
          <Text style={styles.sectionTitle}>Enregistrements ({weights.length})</Text>
          {loadingWeights ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={GREEN} />
            </View>
          ) : weights.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun poids individuel enregistré.</Text>
            </View>
          ) : (
            <FlatList
              data={weights}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.recordCard}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordWeight}>{Number(item.weight).toFixed(2)} kg</Text>
                    <Text style={styles.recordDate}>
                      {new Date(item.date).toLocaleDateString("fr-FR")}
                      {item.animalId ? ` — Animal #${item.animalId}` : ""}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.recordDeleteButton}
                    onPress={() => handleDelete(item)}
                  >
                    <Feather name="trash-2" size={16} color="#dc2626" />
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { marginRight: 8 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN, flex: 1, marginRight: 32 },

  container: { padding: 16, paddingBottom: 40 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 20 },
  errorText: { color: "#dc2626", fontSize: 15, textAlign: "center" },

  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statsTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937", marginBottom: 12 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 14, fontWeight: "800", color: GREEN },
  statLabel: { fontSize: 11, color: "#666", fontWeight: "600", marginTop: 2 },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e0d8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
    marginBottom: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },

  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  cancelFormButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e5e0d8",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelFormButtonText: { color: "#444", fontWeight: "700", fontSize: 12 },
  submitButton: {
    flex: 2,
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  recordsSection: { backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937", marginBottom: 12 },
  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recordInfo: { flex: 1 },
  recordWeight: { fontSize: 14, fontWeight: "700", color: "#111" },
  recordDate: { fontSize: 11, color: "#888", marginTop: 2 },
  recordDeleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", paddingVertical: 20 },
  emptyText: { fontSize: 13, color: "#888" },
});
