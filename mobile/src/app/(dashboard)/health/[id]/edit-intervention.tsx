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

const INTERVENTION_TYPES = [
  { id: "CHECKUP", label: "Check-up", iconName: "stethoscope" },
  { id: "SURGERY", label: "Chirurgie", iconName: "cut" },
  { id: "OBSTETRICS", label: "Obstétrique", iconName: "baby" },
  { id: "ULTRASOUND", label: "Échographie", iconName: "scan" },
  { id: "TREATMENT", label: "Traitement", iconName: "medkit" },
  { id: "EMERGENCY", label: "Urgence", iconName: "alert-circle" },
];

export default function EditInterventionScreen() {
  const { id, interventionId } = useLocalSearchParams<{ id: string; interventionId: string }>();
  const healthRecordId = Number(id);
  const interventionIdNum = Number(interventionId);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "",
    date: "",
    cost: "",
    report: "",
  });

  useEffect(() => {
    async function fetchIntervention() {
      try {
        const response = await api.get(`/health/interventions/${interventionIdNum}`);
        const data = response.data.data;
        setForm({
          type: data.type,
          date: data.date ? data.date.split("T")[0] : "",
          cost: data.cost ? String(data.cost) : "",
          report: data.report || "",
        });
      } catch (err) {
        Alert.alert("Erreur", "Impossible de charger l'intervention");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchIntervention();
  }, [interventionIdNum]);

  async function handleSubmit() {
    if (!form.date.trim()) {
      setError("La date est requise");
      return;
    }
    if (!form.type) {
      setError("Le type d'intervention est requis");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        type: form.type,
        date: new Date(form.date + "T00:00:00.000Z").toISOString(),
        cost: form.cost ? Number(form.cost) : undefined,
        report: form.report || undefined,
      };

      await api.put(`/health/interventions/${interventionIdNum}`, payload);
      Alert.alert("Succès", "Intervention modifiée");
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
        <Text style={styles.headerTitle}>Modifier l'intervention</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Type d'intervention</Text>
          <View style={styles.optionsRow}>
            {INTERVENTION_TYPES.map((t) => (
              <Pressable
                key={t.id}
                style={[
                  styles.optionChip,
                  form.type === t.id && styles.optionChipSelected,
                ]}
                onPress={() => setForm({ ...form, type: t.id })}
              >
                <Ionicons
                  name={t.iconName as any}
                  size={16}
                  color={form.type === t.id ? "#fff" : "#555"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.optionChipText,
                    form.type === t.id && styles.optionChipTextSelected,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-JJ"
            value={form.date}
            onChangeText={(text) => setForm({ ...form, date: text })}
          />

          <Text style={styles.sectionTitle}>Coût (MAD) - optionnel</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 150.00"
            keyboardType="decimal-pad"
            value={form.cost}
            onChangeText={(text) => setForm({ ...form, cost: text })}
          />

          <Text style={styles.sectionTitle}>Rapport - optionnel</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description détaillée de l'intervention..."
            multiline
            numberOfLines={4}
            value={form.report}
            onChangeText={(text) => setForm({ ...form, report: text })}
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN },
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
    marginTop: 12,
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
    height: 100,
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
    marginTop: 16,
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