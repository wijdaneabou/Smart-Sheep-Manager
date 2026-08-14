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
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";

import {
  listBatchCosts,
  createBatchCost,
  deleteBatchCost,
  getFatteningBatchById,
  type FatteningBatchCostRecord,
  type FatteningBatch,
} from "../../../../services/fatteningService";
import { BackButton } from "../../../../components/BackButton";

const GREEN = "#14532d";

const COST_CATEGORIES = [
  "FEED",
  "LABOR",
  "VETERINARY",
  "MEDICINE",
  "TRANSPORT",
  "OTHER",
];

const CATEGORY_LABELS: Record<string, string> = {
  FEED: "Alimentation",
  LABOR: "Main-d'œuvre",
  VETERINARY: "Vétérinaire",
  MEDICINE: "Médicaments",
  TRANSPORT: "Transport",
  OTHER: "Autre",
};

export default function BatchCostsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const batchId = Number(id);

  const [batch, setBatch] = useState<FatteningBatch | null>(null);
  const [costs, setCosts] = useState<FatteningBatchCostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCosts, setLoadingCosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
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

  const loadCosts = useCallback(async () => {
    setLoadingCosts(true);
    const result = await listBatchCosts(batchId);
    if (result.success) {
      setCosts(result.costs);
    } else {
      setError(result.message);
    }
    setLoadingCosts(false);
  }, [batchId]);

  useFocusEffect(
    useCallback(() => {
      loadBatch();
      loadCosts();
    }, [loadBatch, loadCosts])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadCosts();
    setRefreshing(false);
  }

  function validate(): string | null {
    if (!date) return "La date est requise.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Format de date invalide (YYYY-MM-DD).";
    if (!category) return "La catégorie est requise.";
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return "Le montant doit être un nombre positif.";
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
    const result = await createBatchCost({
      fatteningBatchId: batchId,
      category,
      description: description || null,
      amount: Number(amount),
      date,
    });
    setSubmitting(false);

    if (result.success) {
      setCosts((prev) => [result.record as any, ...prev]);
      setDate(new Date().toISOString().split("T")[0]);
      setCategory("");
      setDescription("");
      setAmount("");
      setShowAddForm(false);
      Alert.alert("Succès", "Coût enregistré.");
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  async function handleDelete(record: FatteningBatchCostRecord) {
    Alert.alert(
      "Supprimer",
      `Êtes-vous sûr de vouloir supprimer ce coût ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await deleteBatchCost(record.id);
            if (result.success) {
              setCosts((prev) => prev.filter((r) => r.id !== record.id));
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  function getTotalCost(): number {
    return costs.reduce((sum, r) => sum + Number(r.amount), 0);
  }

  function getCostByCategory(): Record<string, number> {
    return costs.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + Number(r.amount);
      return acc;
    }, {} as Record<string, number>);
  }

  const costByCategory = getCostByCategory();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Coûts du lot</Text>
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
          <Text style={styles.headerTitle}>Coûts du lot</Text>
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
        <Text style={styles.headerTitle}>Coûts — {batch.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Coût total du lot</Text>
          <Text style={styles.summaryValue}>{getTotalCost().toFixed(2)} €</Text>
        </View>

        {Object.keys(costByCategory).length > 0 && (
          <View style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>Répartition par catégorie</Text>
            {COST_CATEGORIES.filter((cat) => costByCategory[cat] !== undefined).map((cat) => (
              <View key={cat} style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>{CATEGORY_LABELS[cat] || cat}</Text>
                <Text style={styles.categoryValue}>{costByCategory[cat].toFixed(2)} €</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Feather name={showAddForm ? "minus" : "plus"} size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>
            {showAddForm ? "Masquer le formulaire" : "AJOUTER UN COÛT"}
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

            <Text style={styles.label}>Catégorie *</Text>
            <View style={styles.chipRow}>
              {COST_CATEGORIES.map((cat) => {
                const selected = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.chip,
                      selected && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Achat de tourteaux"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Montant (€) *</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 1500.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
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
          <Text style={styles.sectionTitle}>Historique des coûts ({costs.length})</Text>
          {loadingCosts ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={GREEN} />
            </View>
          ) : costs.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun coût enregistré.</Text>
            </View>
          ) : (
            <FlatList
              data={costs}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.recordCard}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordCategory}>
                      {CATEGORY_LABELS[item.category] || item.category}
                    </Text>
                    {item.description ? (
                      <Text style={styles.recordDesc}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.recordDate}>
                      {new Date(item.date).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                  <Text style={styles.recordAmount}>{Number(item.amount).toFixed(2)} €</Text>
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

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryLabel: { fontSize: 13, color: "#666", fontWeight: "600", marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: "800", color: GREEN },

  categoryCard: {
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
  categoryTitle: { fontSize: 13, fontWeight: "700", color: "#1f2937", marginBottom: 8 },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  categoryLabel: { fontSize: 13, color: "#555" },
  categoryValue: { fontSize: 13, fontWeight: "700", color: "#111" },

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

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#e5e0d8",
  },
  chipSelected: {
    backgroundColor: GREEN + "20",
    borderColor: GREEN,
  },
  chipText: { fontSize: 12, color: "#555", fontWeight: "600" },
  chipTextSelected: { color: GREEN },

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
  recordCategory: { fontSize: 13, fontWeight: "700", color: "#111" },
  recordDesc: { fontSize: 11, color: "#888", marginTop: 2 },
  recordDate: { fontSize: 11, color: "#888", marginTop: 2 },
  recordAmount: { fontSize: 13, fontWeight: "800", color: GREEN, marginRight: 8 },
  recordDeleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", paddingVertical: 20 },
  emptyText: { fontSize: 13, color: "#888" },
});
