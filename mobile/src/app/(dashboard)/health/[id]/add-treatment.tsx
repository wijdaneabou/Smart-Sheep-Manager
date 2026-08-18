import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../../../../services/api";
import { usePermissions } from "@/contexts/PermissionsContext";

const FREQUENCIES = [
  { id: "ONCE_DAILY", label: "1×/jour" },
  { id: "TWICE_DAILY", label: "2×/jour" },
  { id: "THREE_TIMES_DAILY", label: "3×/jour" },
  { id: "WEEKLY", label: "1×/semaine" },
  { id: "MONTHLY", label: "1×/mois" },
];
const ROUTES = [
  { id: "ORAL", label: "Oral" },
  { id: "INTRAMUSCULAR", label: "Intramusculaire" },
  { id: "INTRAVENOUS", label: "Intraveineux" },
  { id: "SUBCUTANEOUS", label: "Sous-cutané" },
  { id: "TOPICAL", label: "Topique" },
];

export default function AddTreatment() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // ✅ Check with fallback
  useEffect(() => {
    if (!hasPermission('TREATMENT', 'CREATE') && !hasPermission('HEALTH', 'CREATE')) {
      Alert.alert("Accès refusé", "Vous n'avez pas les droits pour ajouter un traitement.");
      router.replace(`/health/${id}/detail` as any);
    }
  }, [hasPermission, router, id]);

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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.medicationName || !form.dosage || !form.startDate)
      return Alert.alert("Erreur", "Champs obligatoires");
    setLoading(true);
    try {
      await api.post("/health/treatments", {
        healthRecordId: Number(id),
        ...form,
        durationDays: form.durationDays ? Number(form.durationDays) : undefined,
        startDate: new Date(form.startDate + "T00:00:00.000Z").toISOString(),
        endDate: form.endDate
          ? new Date(form.endDate + "T00:00:00.000Z").toISOString()
          : undefined,
        nextDoseDate: form.nextDoseDate
          ? new Date(form.nextDoseDate + "T00:00:00.000Z").toISOString()
          : undefined,
      });
      Alert.alert("Succès", "Traitement ajouté");
      router.back();
    } catch (e) {
      Alert.alert("Erreur", "Échec");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
        </View>
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Médicament *</Text>
        <TextInput
          style={styles.input}
          value={form.medicationName}
          onChangeText={(t) => setForm({ ...form, medicationName: t })}
        />
        <Text style={styles.label}>Dosage *</Text>
        <TextInput
          style={styles.input}
          value={form.dosage}
          onChangeText={(t) => setForm({ ...form, dosage: t })}
        />
        <Text style={styles.label}>Fréquence</Text>
        <View style={styles.row}>
          {FREQUENCIES.map((f) => (
            <Pressable
              key={f.id}
              style={[
                styles.chip,
                form.frequency === f.id && styles.chipActive,
              ]}
              onPress={() => setForm({ ...form, frequency: f.id })}
            >
              <Text>{f.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Voie</Text>
        <View style={styles.row}>
          {ROUTES.map((r) => (
            <Pressable
              key={r.id}
              style={[
                styles.chip,
                form.route === r.id && styles.chipActive,
              ]}
              onPress={() => setForm({ ...form, route: r.id })}
            >
              <Text>{r.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Date de début *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={form.startDate}
          onChangeText={(t) => setForm({ ...form, startDate: t })}
        />
        <Text style={styles.label}>Durée (jours)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form.durationDays}
          onChangeText={(t) => setForm({ ...form, durationDays: t })}
        />
        <Text style={styles.label}>Date de fin</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={form.endDate}
          onChangeText={(t) => setForm({ ...form, endDate: t })}
        />
        <Text style={styles.label}>Prochaine dose</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={form.nextDoseDate}
          onChangeText={(t) => setForm({ ...form, nextDoseDate: t })}
        />
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={form.notes}
          onChangeText={(t) => setForm({ ...form, notes: t })}
        />
        <Pressable
          style={styles.submit}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.submitText}>AJOUTER</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#faf6f1" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { fontSize: 28, color: "#1a1a1a" },
  container: { padding: 16, paddingTop: 4 },
  label: { fontWeight: "600", marginTop: 4, marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e0d8",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chipActive: { backgroundColor: "#14532d", borderColor: "#14532d" },
  submit: {
    backgroundColor: "#14532d",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});