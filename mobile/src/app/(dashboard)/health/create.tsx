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
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import api from "../../../services/api";

const STATUSES = [
  { id: "HEALTHY", label: "Sain", icon: "✅" },
  { id: "SURVEILLANCE", label: "Surveillance", icon: "👀" },
  { id: "SICK", label: "Malade", icon: "🤒" },
  { id: "UNDER_TREATMENT", label: "En traitement", icon: "💊" },
  { id: "RECOVERED", label: "Rétabli", icon: "💪" },
];

const SEVERITIES = [
  { id: "LOW", label: "Faible", color: "#16a34a" },
  { id: "MEDIUM", label: "Moyenne", color: "#ca8a04" },
  { id: "HIGH", label: "Élevée", color: "#ea580c" },
  { id: "CRITICAL", label: "Critique", color: "#dc2626" },
];

export default function CreateHealthRecord() {
  const router = useRouter();
  const [animals, setAnimals] = useState<any[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(true);
  const [form, setForm] = useState({
    animalId: "",
    status: "HEALTHY",
    symptoms: "",
    diagnosis: "",
    severity: "LOW",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/animals")
      .then(res => {
        setAnimals(res.data.data);
        setLoadingAnimals(false);
      })
      .catch(() => setLoadingAnimals(false));
  }, []);

  function validate(): string | null {
    if (!form.animalId) return "Veuillez sélectionner un animal.";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post("/health/records", {
        animalId: Number(form.animalId),
        status: form.status,
        symptoms: form.symptoms || undefined,
        diagnosis: form.diagnosis || undefined,
        severity: form.severity,
      });
      Alert.alert("Succès", "Dossier médical créé");
      router.back();
    } catch (err) {
      setError("Erreur lors de la création");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#14532d" />
          </Pressable>
          <Text style={styles.headerTitle}>Nouveau dossier médical</Text>
          <View style={styles.headerAvatar}>
            <Ionicons name="medical" size={18} color="#fff" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Animal */}
          <SectionTitle index={1} label="Animal" />
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Sélectionner un animal</Text>
            {loadingAnimals ? (
              <ActivityIndicator style={{ marginTop: 12 }} />
            ) : (
              <View style={styles.animalGrid}>
                {animals.map((animal) => {
                  const selected = form.animalId === String(animal.id);
                  return (
                    <Pressable
                      key={animal.id}
                      onPress={() => setForm({ ...form, animalId: String(animal.id) })}
                      style={[
                        styles.animalChip,
                        selected && styles.animalChipSelected,
                      ]}
                    >
                      <Text style={[styles.animalChipIcon, selected && { color: "#fff" }]}>
                        🐑
                      </Text>
                      <Text style={[styles.animalChipLabel, selected && { color: "#fff" }]}>
                        {animal.name}
                      </Text>
                      <Text style={[styles.animalChipSub, selected && { color: "#fff" }]}>
                        {animal.rfid}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* 2. Statut */}
          <SectionTitle index={2} label="Statut" />
          <View style={styles.fieldGroup}>
            <View style={styles.optionsRow}>
              {STATUSES.map((s) => {
                const selected = form.status === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setForm({ ...form, status: s.id })}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                  >
                    <Text style={[styles.optionChipIcon, selected && { color: "#fff" }]}>
                      {s.icon}
                    </Text>
                    <Text style={[styles.optionChipLabel, selected && { color: "#fff" }]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 3. Gravité */}
          <SectionTitle index={3} label="Gravité" />
          <View style={styles.fieldGroup}>
            <View style={styles.optionsRow}>
              {SEVERITIES.map((s) => {
                const selected = form.severity === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setForm({ ...form, severity: s.id })}
                    style={[
                      styles.optionChip,
                      selected && { backgroundColor: s.color, borderColor: s.color },
                    ]}
                  >
                    <Text style={[styles.optionChipLabel, selected && { color: "#fff" }]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 4. Symptômes */}
          <SectionTitle index={4} label="Symptômes" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.textArea}
              placeholder="Décrivez les symptômes..."
              multiline
              numberOfLines={4}
              value={form.symptoms}
              onChangeText={(text) => setForm({ ...form, symptoms: text })}
            />
          </View>

          {/* 5. Diagnostic */}
          <SectionTitle index={5} label="Diagnostic" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.textArea}
              placeholder="Diagnostic..."
              multiline
              numberOfLines={3}
              value={form.diagnosis}
              onChangeText={(text) => setForm({ ...form, diagnosis: text })}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actionsRow}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>ANNULER</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="save" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>ENREGISTRER</Text>
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
    paddingTop: 8,
  },
  backButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: GREEN },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { padding: 20, paddingTop: 4, flexGrow: 1 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 12 },
  sectionBar: { width: 4, height: 14, backgroundColor: GREEN, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937" },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  animalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  animalChip: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  animalChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  animalChipIcon: { fontSize: 22, marginBottom: 2 },
  animalChipLabel: { fontSize: 13, fontWeight: "700", color: "#333" },
  animalChipSub: { fontSize: 10, color: "#888" },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  optionChip: {
    flex: 1,
    minWidth: "28%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  optionChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  optionChipIcon: { fontSize: 18, marginBottom: 4, color: "#555" },
  optionChipLabel: { fontSize: 12, fontWeight: "700", color: "#555" },
  textArea: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
    minHeight: 80,
    textAlignVertical: "top",
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
  submitButton: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});