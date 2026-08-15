import { useCallback, useState, useEffect } from "react";
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
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import api from "../../../../services/api";
import { usePermissions } from "@/contexts/PermissionsContext";

const STATUSES = [
  { id: "HEALTHY", label: "Sain", iconName: "checkmark-circle" },
  { id: "SURVEILLANCE", label: "Surveillance", iconName: "eye" },
  { id: "SICK", label: "Malade", iconName: "medkit" },
  { id: "UNDER_TREATMENT", label: "En traitement", iconName: "pill" },
  { id: "RECOVERED", label: "Rétabli", iconName: "body" },
];

const SEVERITIES = [
  { id: "LOW", label: "Faible", color: "#16a34a" },
  { id: "MEDIUM", label: "Moyenne", color: "#ca8a04" },
  { id: "HIGH", label: "Élevée", color: "#ea580c" },
  { id: "CRITICAL", label: "Critique", color: "#dc2626" },
];

export default function EditHealthRecord() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordId = Number(id);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // You can keep a guard here if you want, but we rely on the button in detail.tsx
  // If you want to keep it, add fallback:
  // const canEdit = hasPermission('HEALTH_RECORD', 'UPDATE') || hasPermission('HEALTH', 'UPDATE');
  // useEffect(() => { if (!canEdit) { ... } }, [])

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    status: "",
    symptoms: "",
    diagnosis: "",
    severity: "",
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoadingData(true);
      api.get(`/health/records/${recordId}`)
        .then((res) => {
          if (!active) return;
          const data = res.data.data;
          setForm({
            status: data.status,
            symptoms: data.symptoms || "",
            diagnosis: data.diagnosis || "",
            severity: data.severity || "LOW",
          });
        })
        .catch((err) => {
          setError("Erreur de chargement");
          console.error(err);
        })
        .finally(() => {
          if (active) setLoadingData(false);
        });
      return () => { active = false; };
    }, [recordId])
  );

  function validate(): string | null {
    if (!form.status) return "Veuillez sélectionner un statut.";
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

    try {
      await api.put(`/health/records/${recordId}`, {
        status: form.status,
        symptoms: form.symptoms || undefined,
        diagnosis: form.diagnosis || undefined,
        severity: form.severity,
      });
      router.back();
    } catch (err) {
      setError("Erreur lors de la mise à jour");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ActivityIndicator style={{ marginTop: 40 }} />
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
          <Text style={styles.headerTitle}>Modifier le dossier</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <SectionTitle index={1} label="Statut" />
          <View style={styles.fieldGroup}>
            <View style={styles.typeRow}>
              {STATUSES.map((s) => {
                const selected = form.status === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setForm({ ...form, status: s.id })}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                  >
                    <Ionicons
                      name={s.iconName as any}
                      size={18}
                      color={selected ? "#fff" : "#555"}
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={[styles.typeChipLabel, selected && { color: "#fff" }]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <SectionTitle index={2} label="Gravité" />
          <View style={styles.fieldGroup}>
            <View style={styles.typeRow}>
              {SEVERITIES.map((s) => {
                const selected = form.severity === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setForm({ ...form, severity: s.id })}
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

          <SectionTitle index={3} label="Symptômes" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="Décrivez les symptômes..."
              multiline
              numberOfLines={4}
              value={form.symptoms}
              onChangeText={(text) => setForm({ ...form, symptoms: text })}
            />
          </View>

          <SectionTitle index={4} label="Diagnostic" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="Diagnostic..."
              multiline
              numberOfLines={3}
              value={form.diagnosis}
              onChangeText={(text) => setForm({ ...form, diagnosis: text })}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

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
  container: { padding: 20, paddingTop: 4, flexGrow: 1 },

  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 12 },
  sectionBar: { width: 4, height: 14, backgroundColor: GREEN, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937" },

  fieldGroup: { marginBottom: 14 },
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

  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeChip: {
    flex: 1,
    minWidth: "30%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 14,
  },
  typeChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  typeChipLabel: { fontSize: 12, fontWeight: "700", color: "#555" },

  error: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
  },

  button: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});