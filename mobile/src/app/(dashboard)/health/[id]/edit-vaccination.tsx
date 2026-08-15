import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../../services/api";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type VaccinationStatus = "PENDING" | "DONE" | "OVERDUE";

const STATUS_OPTIONS: Array<{ id: VaccinationStatus; label: string; iconName: string }> = [
  { id: "PENDING", label: "En attente", iconName: "time" },
  { id: "DONE", label: "Effectué", iconName: "checkmark-circle" },
  { id: "OVERDUE", label: "En retard", iconName: "alert-circle" },
];

export default function EditVaccinationScreen() {
  const { id, vaccinationId } = useLocalSearchParams<{ id: string; vaccinationId: string }>();
  const healthRecordId = Number(id);
  const vaccinationIdNum = Number(vaccinationId);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    vaccineType: "",
    batchNumber: "",
    date: "",
    boosterDate: "",
    notes: "",
    status: "PENDING" as VaccinationStatus,
  });

  useEffect(() => {
    async function fetchVaccination() {
      try {
        const response = await api.get(`/health/vaccinations/${vaccinationIdNum}`);
        const data = response.data.data;
        setForm({
          vaccineType: data.vaccineType || "",
          batchNumber: data.batchNumber || "",
          date: data.date ? String(data.date).split("T")[0] : "",
          boosterDate: data.boosterDate ? String(data.boosterDate).split("T")[0] : "",
          notes: data.notes || "",
          status: (data.status || "PENDING") as VaccinationStatus,
        });
      } catch (err) {
        Alert.alert("Erreur", "Impossible de charger la vaccination");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchVaccination();
  }, [vaccinationIdNum]);

  function validateDate(value: string, label: string) {
    if (!DATE_RE.test(value)) {
      setError(`${label} doit être au format AAAA-MM-JJ`);
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!form.vaccineType.trim()) {
      setError("Le type de vaccin est requis");
      return;
    }
    if (!form.date.trim()) {
      setError("La date est requise");
      return;
    }
    if (!validateDate(form.date.trim(), "La date")) return;
    if (form.boosterDate.trim() && !validateDate(form.boosterDate.trim(), "La date de rappel")) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        vaccineType: form.vaccineType.trim(),
        batchNumber: form.batchNumber.trim() || undefined,
        date: new Date(`${form.date.trim()}T00:00:00.000Z`).toISOString(),
        boosterDate: form.boosterDate.trim() ? new Date(`${form.boosterDate.trim()}T00:00:00.000Z`).toISOString() : undefined,
        notes: form.notes.trim() || undefined,
        status: form.status,
      };

      await api.put(`/health/vaccinations/${vaccinationIdNum}`, payload);
      Alert.alert("Succès", "Vaccination modifiée");
      router.back();
    } catch (err) {
      setError("Erreur lors de la modification de la vaccination");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color="#14532d" />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier la vaccination</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Type de vaccin</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Clostridie, contre la fièvre aphteuse"
            value={form.vaccineType}
            onChangeText={(text) => setForm({ ...form, vaccineType: text })}
          />

          <Text style={styles.sectionTitle}>Numéro de lot - optionnel</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: LOT-2026-01"
            value={form.batchNumber}
            onChangeText={(text) => setForm({ ...form, batchNumber: text })}
          />

          <Text style={styles.sectionTitle}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-JJ"
            value={form.date}
            onChangeText={(text) => setForm({ ...form, date: text })}
          />

          <Text style={styles.sectionTitle}>Date de rappel - optionnel</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-JJ"
            value={form.boosterDate}
            onChangeText={(text) => setForm({ ...form, boosterDate: text })}
          />

          <Text style={styles.sectionTitle}>Statut</Text>
          <View style={styles.optionsRow}>
            {STATUS_OPTIONS.map((status) => (
              <Pressable
                key={status.id}
                style={[styles.optionChip, form.status === status.id && styles.optionChipSelected]}
                onPress={() => setForm({ ...form, status: status.id })}
              >
                <Ionicons
                  name={status.iconName as any}
                  size={14}
                  color={form.status === status.id ? "#fff" : "#555"}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.optionChipText, form.status === status.id && styles.optionChipTextSelected]}>
                  {status.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Notes - optionnel</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes supplémentaires"
            multiline
            numberOfLines={4}
            value={form.notes}
            onChangeText={(text) => setForm({ ...form, notes: text })}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actionsRow}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>ANNULER</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>MODIFIER</Text>}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  container: { padding: 16, paddingTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#444", marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#1f2937",
    marginBottom: 6,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
  },
  optionChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  optionChipText: { fontSize: 12, fontWeight: "600", color: "#555" },
  optionChipTextSelected: { color: "#fff" },
  error: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    fontSize: 13,
  },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelButtonText: { color: "#333", fontWeight: "700", fontSize: 13 },
  submitButton: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});