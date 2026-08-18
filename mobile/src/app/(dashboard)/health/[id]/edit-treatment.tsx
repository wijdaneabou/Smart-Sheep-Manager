import { useState, useEffect } from "react";
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

const FREQUENCIES = [
  { id: "ONCE_DAILY", label: "1×/jour", iconName: "time" },
  { id: "TWICE_DAILY", label: "2×/jour", iconName: "time" },
  { id: "THREE_TIMES_DAILY", label: "3×/jour", iconName: "time" },
  { id: "WEEKLY", label: "1×/semaine", iconName: "calendar" },
  { id: "MONTHLY", label: "1×/mois", iconName: "calendar" },
];

const ROUTES = [
  { id: "ORAL", label: "Oral", iconName: "nutrition" },
  { id: "INTRAMUSCULAR", label: "Intramusculaire", iconName: "fitness" },
  { id: "INTRAVENOUS", label: "Intraveineux", iconName: "water" },
  { id: "SUBCUTANEOUS", label: "Sous-cutané", iconName: "layers" },
  { id: "TOPICAL", label: "Topique", iconName: "brush" },
];

export default function EditTreatmentScreen() {
  const { id, treatmentId } = useLocalSearchParams<{ id: string; treatmentId: string }>();
  const healthRecordId = Number(id);
  const treatmentIdNum = Number(treatmentId);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    medicationName: "",
    dosage: "",
    frequency: "ONCE_DAILY",
    route: "ORAL",
    startDate: "",
    durationDays: "",
    endDate: "",
    nextDoseDate: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchTreatment() {
      try {
        const response = await api.get(`/health/treatments/${treatmentIdNum}`);
        const data = response.data.data;
        setForm({
          medicationName: data.medicationName,
          dosage: data.dosage,
          frequency: data.frequency,
          route: data.route,
          startDate: data.startDate ? data.startDate.split("T")[0] : "",
          durationDays: data.durationDays ? String(data.durationDays) : "",
          endDate: data.endDate ? data.endDate.split("T")[0] : "",
          nextDoseDate: data.nextDoseDate ? data.nextDoseDate.split("T")[0] : "",
          notes: data.notes || "",
        });
      } catch (err) {
        Alert.alert("Erreur", "Impossible de charger le traitement");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTreatment();
  }, [treatmentIdNum]);

  async function handleSubmit() {
    if (!form.medicationName.trim()) {
      setError("Le nom du médicament est requis");
      return;
    }
    if (!form.dosage.trim()) {
      setError("Le dosage est requis");
      return;
    }
    if (!form.startDate.trim()) {
      setError("La date de début est requise");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        medicationName: form.medicationName.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        route: form.route,
        startDate: new Date(form.startDate + "T00:00:00.000Z").toISOString(),
        durationDays: form.durationDays ? Number(form.durationDays) : undefined,
        endDate: form.endDate ? new Date(form.endDate + "T00:00:00.000Z").toISOString() : undefined,
        nextDoseDate: form.nextDoseDate ? new Date(form.nextDoseDate + "T00:00:00.000Z").toISOString() : undefined,
        notes: form.notes || undefined,
      };

      await api.put(`/health/treatments/${treatmentIdNum}`, payload);
      Alert.alert("Succès", "Traitement modifié");
      router.back();
    } catch (err) {
      setError("Erreur lors de la modification");
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
        </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Médicament</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom du médicament"
            value={form.medicationName}
            onChangeText={(text) => setForm({ ...form, medicationName: text })}
          />

          <Text style={styles.sectionTitle}>Dosage</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 10 ml, 2 comprimés"
            value={form.dosage}
            onChangeText={(text) => setForm({ ...form, dosage: text })}
          />

          <Text style={styles.sectionTitle}>Fréquence</Text>
          <View style={styles.optionsRow}>
            {FREQUENCIES.map((f) => (
              <Pressable
                key={f.id}
                style={[
                  styles.optionChip,
                  form.frequency === f.id && styles.optionChipSelected,
                ]}
                onPress={() => setForm({ ...form, frequency: f.id })}
              >
                <Ionicons
                  name={f.iconName as any}
                  size={14}
                  color={form.frequency === f.id ? "#fff" : "#555"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.optionChipText,
                    form.frequency === f.id && styles.optionChipTextSelected,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Voie d'administration</Text>
          <View style={styles.optionsRow}>
            {ROUTES.map((r) => (
              <Pressable
                key={r.id}
                style={[
                  styles.optionChip,
                  form.route === r.id && styles.optionChipSelected,
                ]}
                onPress={() => setForm({ ...form, route: r.id })}
              >
                <Ionicons
                  name={r.iconName as any}
                  size={14}
                  color={form.route === r.id ? "#fff" : "#555"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.optionChipText,
                    form.route === r.id && styles.optionChipTextSelected,
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Date de début</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-JJ"
            value={form.startDate}
            onChangeText={(text) => setForm({ ...form, startDate: text })}
          />

          <Text style={styles.sectionTitle}>Durée (jours) - optionnel</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 5"
            keyboardType="numeric"
            value={form.durationDays}
            onChangeText={(text) => setForm({ ...form, durationDays: text })}
          />

          <Text style={styles.sectionTitle}>Date de fin - optionnel</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-JJ"
            value={form.endDate}
            onChangeText={(text) => setForm({ ...form, endDate: text })}
          />

          <Text style={styles.sectionTitle}>Prochaine dose - optionnel</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-JJ"
            value={form.nextDoseDate}
            onChangeText={(text) => setForm({ ...form, nextDoseDate: text })}
          />

          <Text style={styles.sectionTitle}>Notes - optionnel</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes supplémentaires"
            multiline
            numberOfLines={3}
            value={form.notes}
            onChangeText={(text) => setForm({ ...form, notes: text })}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actionsRow}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>ANNULER</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>MODIFIER</Text>
              )}
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
  container: { padding: 16, paddingTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginTop: 4,
    marginBottom: 6,
  },
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
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
  optionChipSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  optionChipTextSelected: {
    color: "#fff",
  },
  error: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
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
  submitButton: {
    flex: 2,
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});