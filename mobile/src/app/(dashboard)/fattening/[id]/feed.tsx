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
  RefreshControl as RNRefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  listFeedRecords,
  createFeedRecord,
  deleteFeedRecord,
  getFatteningBatchById,
  type FatteningFeedRecord,
  type FatteningBatch,
} from "../../../../services/fatteningService";
import { BackButton } from "../../../../components/BackButton";
import Pagination from "@/components/Pagination";

const GREEN = "#14532d";

const FEED_TYPES = [
  "Ensilage",
  "Graines",
  "Tourteaux",
  "Cônes",
  "Suppléments",
  "Fumier",
  "Autre",
];

export default function BatchFeedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const batchId = Number(id);

  const [batch, setBatch] = useState<FatteningBatch | null>(null);
  const [feedRecords, setFeedRecords] = useState<FatteningFeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [feedType, setFeedType] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
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

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    const result = await listFeedRecords(batchId, page, PAGE_SIZE);
    if (result.success) {
      setFeedRecords(result.records);
      const total = result.pagination?.total ?? 0;
      const limit = result.pagination?.limit ?? PAGE_SIZE;
      setTotalPages(Math.max(1, Math.ceil(total / limit)));
    } else {
      setError(result.message);
    }
    setLoadingRecords(false);
  }, [batchId, page]);

  useFocusEffect(
    useCallback(() => {
      loadBatch();
      loadRecords();
    }, [loadBatch, loadRecords])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  }

  function validate(): string | null {
    if (!date) return "La date est requise.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Format de date invalide (YYYY-MM-DD).";
    if (!feedType.trim()) return "Le type d'aliment est requis.";
    if (!quantityKg || Number.isNaN(Number(quantityKg)) || Number(quantityKg) <= 0) {
      return "La quantité doit être un nombre positif.";
    }
    if (!unitPrice || Number.isNaN(Number(unitPrice)) || Number(unitPrice) <= 0) {
      return "Le prix unitaire doit être un nombre positif.";
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
    const result = await createFeedRecord({
      fatteningBatchId: batchId,
      date,
      feedType: feedType.trim(),
      quantityKg: Number(quantityKg),
      unitPrice: Number(unitPrice),
      note: note || null,
    });
    setSubmitting(false);

    if (result.success) {
      setFeedRecords((prev) => [result.record as any, ...prev]);
      setDate(today);
      setFeedType("");
      setQuantityKg("");
      setUnitPrice("");
      setNote("");
      setShowAddForm(false);
      Alert.alert("Succès", "Enregistrement d’alimentation ajouté.");
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  async function handleDelete(record: FatteningFeedRecord) {
    Alert.alert(
      "Supprimer",
      `Êtes-vous sûr de vouloir supprimer cet enregistrement d’alimentation ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await deleteFeedRecord(record.id);
            if (result.success) {
              setFeedRecords((prev) => prev.filter((r) => r.id !== record.id));
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  function getTotalFeedCost(): number {
    return feedRecords.reduce((sum, r) => sum + Number(r.totalCost), 0);
  }

  function getTotalFeedKg(): number {
    return feedRecords.reduce((sum, r) => sum + Number(r.quantityKg), 0);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Alimentation du lot</Text>
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
          <Text style={styles.headerTitle}>Alimentation du lot</Text>
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
        <Text style={styles.headerTitle}>Alimentation — {batch.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RNRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total feed (kg)</Text>
            <Text style={styles.summaryValue}>{getTotalFeedKg().toFixed(2)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Coût total</Text>
            <Text style={styles.summaryValue}>{getTotalFeedCost().toFixed(2)} DH</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Enregistrements</Text>
            <Text style={styles.summaryValue}>{feedRecords.length}</Text>
          </View>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Feather name={showAddForm ? "minus" : "plus"} size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>
            {showAddForm ? "Masquer le formulaire" : "AJOUTER UNE ENREGISTREMENT"}
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

            <Text style={styles.label}>Type d’aliment *</Text>
            <View style={styles.feedTypeRow}>
              {FEED_TYPES.map((type) => {
                const selected = feedType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setFeedType(type)}
                    style={[
                      styles.feedTypeChip,
                      selected && styles.feedTypeChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.feedTypeChipText,
                        selected && styles.feedTypeChipTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {feedType === "Autre" && (
              <TextInput
                style={styles.input}
                placeholder="Spécifiez le type d'aliment"
                value={feedType}
                onChangeText={setFeedType}
              />
            )}

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.rowItem]}>
                <Text style={styles.label}>Quantité (kg) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ex: 12.5"
                  keyboardType="decimal-pad"
                  value={quantityKg}
                  onChangeText={setQuantityKg}
                />
              </View>
              <View style={[styles.fieldGroup, styles.rowItem]}>
                <Text style={styles.label}>Prix unitaire (DH/kg) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ex: 3.50"
                  keyboardType="decimal-pad"
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                />
              </View>
            </View>

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
          <Text style={styles.sectionTitle}>Historique des alimentations</Text>
          {loadingRecords ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={GREEN} />
            </View>
          ) : feedRecords.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun enregistrement d’alimentation.</Text>
            </View>
          ) : (
            <FlatList
              data={feedRecords}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.recordCard}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordFeedType}>{item.feedType}</Text>
                    <Text style={styles.recordDate}>
                      {new Date(item.date).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                  <View style={styles.recordAmounts}>
                    <Text style={styles.recordQuantity}>{Number(item.quantityKg).toFixed(2)} kg</Text>
                    <Text style={styles.recordCost}>
                      {(Number(item.quantityKg) * Number(item.unitPrice)).toFixed(2)} DH
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

        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { color: "#dc2626", fontSize: 15, textAlign: "center" },

  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  summaryBox: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 11, color: "#666", fontWeight: "600", marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: "800", color: GREEN },

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
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  fieldGroup: { marginBottom: 14 },

  feedTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  feedTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#e5e0d8",
  },
  feedTypeChipSelected: {
    backgroundColor: GREEN + "20",
    borderColor: GREEN,
  },
  feedTypeChipText: { fontSize: 12, color: "#555", fontWeight: "600" },
  feedTypeChipTextSelected: { color: GREEN },

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
  recordFeedType: { fontSize: 13, fontWeight: "700", color: "#111" },
  recordDate: { fontSize: 11, color: "#888", marginTop: 2 },
  recordAmounts: { alignItems: "flex-end", marginRight: 12 },
  recordQuantity: { fontSize: 13, fontWeight: "600", color: "#15803D" },
  recordCost: { fontSize: 12, color: "#666", marginTop: 2 },
  recordDeleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", paddingVertical: 20 },
  emptyText: { fontSize: 13, color: "#888" },
});
