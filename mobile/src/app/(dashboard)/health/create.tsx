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
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import api from "../../../services/api";
import { BackButton } from "../../../components/BackButton";

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
  const [filteredAnimals, setFilteredAnimals] = useState<any[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState<any | null>(null);

  const [form, setForm] = useState({
    animalId: "",
    status: "HEALTHY",
    symptoms: "",
    diagnosis: "",
    severity: "LOW",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des animaux une fois
  useEffect(() => {
    api.get("/animals")
      .then(res => {
        setAnimals(res.data.data);
        setLoadingAnimals(false);
      })
      .catch(() => setLoadingAnimals(false));
  }, []);

  // Filtrer les animaux en fonction de la recherche (RFID ou nom)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAnimals([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const filtered = animals.filter((a) =>
      a.rfid.toLowerCase().includes(query) ||
      a.name.toLowerCase().includes(query)
    );
    setFilteredAnimals(filtered);
  }, [searchQuery, animals]);

  // Sélectionner un animal
  const selectAnimal = (animal: any) => {
    setSelectedAnimal(animal);
    setForm({ ...form, animalId: String(animal.id) });
    setSearchQuery(animal.rfid); // Affiche le RFID dans la barre
    setFilteredAnimals([]); // Cache la liste
  };

  // Effacer la sélection
  const clearSelection = () => {
    setSelectedAnimal(null);
    setForm({ ...form, animalId: "" });
    setSearchQuery("");
    setFilteredAnimals([]);
  };

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
      router.replace("/health");
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
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Nouveau dossier médical</Text>
          <View style={styles.headerAvatar}>
            <Ionicons name="medical" size={18} color="#fff" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Recherche et sélection de l'animal */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Rechercher un animal par RFID ou nom</Text>
            <View style={styles.searchWrapper}>
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Ex: MA202600001245 ou Shahin"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {selectedAnimal && (
                <Pressable onPress={clearSelection} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </Pressable>
              )}
            </View>

            {/* Liste des résultats */}
            {filteredAnimals.length > 0 && (
              <View style={styles.resultsContainer}>
                <FlatList
                  data={filteredAnimals}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.resultItem}
                      onPress={() => selectAnimal(item)}
                    >
                      <Text style={styles.resultRfid}>{item.rfid}</Text>
                      <Text style={styles.resultName}>{item.name}</Text>
                    </Pressable>
                  )}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}

            {/* Animal sélectionné */}
            {selectedAnimal && (
              <View style={styles.selectedCard}>
                <View style={styles.selectedContent}>
                  <Text style={styles.selectedIcon}>🐑</Text>
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName}>{selectedAnimal.name}</Text>
                    <Text style={styles.selectedRfid}>{selectedAnimal.rfid}</Text>
                  </View>
                </View>
                <Pressable onPress={clearSelection} style={styles.selectedClear}>
                  <Text style={styles.selectedClearText}>✕</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* 2. Statut (compact) */}
          <SectionTitle index={2} label="Statut" />
          <View style={styles.fieldGroup}>
            <View style={styles.optionsRowSmall}>
              {STATUSES.map((s) => {
                const selected = form.status === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setForm({ ...form, status: s.id })}
                    style={[styles.optionChipSmall, selected && styles.optionChipSelectedSmall]}
                  >
                    <Text style={[styles.optionChipIconSmall, selected && { color: "#fff" }]}>
                      {s.icon}
                    </Text>
                    <Text style={[styles.optionChipLabelSmall, selected && { color: "#fff" }]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 3. Gravité (compact) */}
          <SectionTitle index={3} label="Gravité" />
          <View style={styles.fieldGroup}>
            <View style={styles.optionsRowSmall}>
              {SEVERITIES.map((s) => {
                const selected = form.severity === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setForm({ ...form, severity: s.id })}
                    style={[
                      styles.optionChipSmall,
                      selected && { backgroundColor: s.color, borderColor: s.color },
                    ]}
                  >
                    <Text style={[styles.optionChipLabelSmall, selected && { color: "#fff" }]}>
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
  backButton: {
    marginRight: 0,
  },
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

  // Search
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: "#1f2937",
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 150,
  },
  resultItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resultRfid: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  resultName: {
    fontSize: 14,
    color: "#6B7280",
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F8ED",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    justifyContent: "space-between",
  },
  selectedContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedIcon: { fontSize: 24, marginRight: 12 },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 16, fontWeight: "700", color: "#0F2A1D" },
  selectedRfid: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  selectedClear: {
    padding: 6,
  },
  selectedClearText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "700",
  },

  // Options compactes (Statuts et Gravités)
  optionsRowSmall: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  optionChipSmall: {
    flex: 1,
    minWidth: "18%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  optionChipSelectedSmall: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  optionChipIconSmall: {
    fontSize: 14,
    marginBottom: 2,
    color: "#555",
  },
  optionChipLabelSmall: {
    fontSize: 10,
    fontWeight: "700",
    color: "#555",
  },

  // Champs texte
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