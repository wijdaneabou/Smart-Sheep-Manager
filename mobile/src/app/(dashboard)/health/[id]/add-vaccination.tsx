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
import { usePermissions } from "@/contexts/PermissionsContext";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function AddVaccinationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const healthRecordId = Number(id);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // ✅ Check with fallback
  useEffect(() => {
    if (!hasPermission('VACCINATION', 'CREATE') && !hasPermission('HEALTH', 'CREATE')) {
      Alert.alert("Accès refusé", "Vous n'avez pas les droits pour ajouter une vaccination.");
      router.replace(`/health/${healthRecordId}/detail` as any);
    }
  }, [hasPermission, router, healthRecordId]);

  const [animalId, setAnimalId] = useState<number | null>(null);
  const [form, setForm] = useState({
    vaccineType: "",
    batchNumber: "",
    date: "",
    boosterDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecord() {
      try {
        const response = await api.get(`/health/records/${healthRecordId}`);
        setAnimalId(response.data.data?.animalId ?? null);
      } catch (err) {
        Alert.alert("Erreur", "Impossible de charger le dossier médical");
        console.error(err);
      }
    }
    fetchRecord();
  }, [healthRecordId]);

  function validateDate(value: string, label: string) {
    if (!DATE_RE.test(value)) {
      setError(`${label} doit être au format AAAA-MM-JJ`);
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!animalId) {
      setError("Impossible de déterminer l'animal lié à ce dossier");
      return;
    }

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

    setLoading(true);
    setError(null);

    try {
      const payload = {
        animalId: animalId ?? healthRecordId,
        vaccineType: form.vaccineType.trim(),
        batchNumber: form.batchNumber.trim() || undefined,
        date: new Date(`${form.date.trim()}T00:00:00.000Z`).toISOString(),
        boosterDate: form.boosterDate.trim()
          ? new Date(`${form.boosterDate.trim()}T00:00:00.000Z`).toISOString()
          : undefined,
        notes: form.notes.trim() || undefined,
      };

      await api.post("/health/vaccinations", payload);
      Alert.alert("Succès", "Vaccination ajoutée");
      router.back();
    } catch (err) {
      setError("Erreur lors de l'ajout de la vaccination");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color="#14532d" />
        </Pressable>
        <Text style={styles.headerTitle}>Nouvelle vaccination</Text>
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
            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>AJOUTER</Text>}
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