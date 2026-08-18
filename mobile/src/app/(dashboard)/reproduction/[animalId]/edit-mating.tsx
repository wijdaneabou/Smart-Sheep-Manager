import { useState, useEffect, useMemo } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { listAnimals, type Animal } from "../../../../services/animalsService";
import { matingService, MatingService } from "../../../../services/matingService";

export default function EditMatingScreen() {
  const { animalId, matingId } = useLocalSearchParams<{
    animalId: string;
    matingId: string;
  }>();
  const femaleId = parseInt(animalId);
  const id = parseInt(matingId);

  const router = useRouter();

  // États du formulaire
  const [serviceDate, setServiceDate] = useState("");
  const [type, setType] = useState<"natural" | "ai">("natural");
  const [maleId, setMaleId] = useState<number | null>(null);
  const [semenReference, setSemenReference] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<"success" | "failure" | "pending">("pending");

  const [maleSearch, setMaleSearch] = useState("");
  const [allMales, setAllMales] = useState<{ id: number; name: string; rfid: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Charger les données
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Charger les mâles
        const result = await listAnimals({ sex: "MALE" });
        if (result.success) {
          setAllMales(
            (result.data || []).map((a: Animal) => ({
              id: a.id,
              name: a.name,
              rfid: a.rfid,
            }))
          );
        }

        // 2. Charger la saillie
        const matingRes = await matingService.getByAnimal(femaleId);
        const mating = matingRes.data.data.find((m: MatingService) => m.id === id);
        if (mating) {
          setServiceDate(mating.serviceDate);
          setType(mating.type);
          setMaleId(mating.maleId);
          setSemenReference(mating.semenReference || "");
          setNotes(mating.notes || "");
          setResult(mating.result);
        } else {
          Alert.alert("Erreur", "Saillie non trouvée.");
          router.back();
        }
      } catch (error) {
        Alert.alert("Erreur", "Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredMales = useMemo(() => {
    const q = maleSearch.trim().toLowerCase();
    if (!q) return allMales;
    return allMales.filter(
      (m) => m.name.toLowerCase().includes(q) || m.rfid.toLowerCase().includes(q)
    );
  }, [allMales, maleSearch]);

  async function handleSubmit() {
    if (!serviceDate) {
      Alert.alert("Erreur", "La date de service est requise.");
      return;
    }
    if (type === "natural" && !maleId) {
      Alert.alert("Erreur", "Veuillez sélectionner un mâle.");
      return;
    }
    if (type === "ai" && !semenReference.trim()) {
      Alert.alert("Erreur", "La référence de semence est requise.");
      return;
    }

    setSubmitting(true);
    try {
      await matingService.update(id, {
        serviceDate,
        maleId: type === "natural" ? maleId : null,
        semenReference: type === "ai" ? semenReference : null,
        result,
        notes: notes || null,
      });
      Alert.alert("Succès", "Saillie mise à jour.");
      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour la saillie.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
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
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <View style={styles.avatar}>
            <Ionicons name="heart" size={16} color="#fff" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Date */}
          <SectionTitle index={1} label="Date de service" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#aaa"
              value={serviceDate}
              onChangeText={setServiceDate}
            />
          </View>

          {/* 2. Type (non modifiable) */}
          <SectionTitle index={2} label="Type d'accouplement" />
          <View style={styles.fieldGroup}>
            <View style={styles.typeRow}>
              <View style={[styles.typeChip, type === "natural" && styles.typeChipSelected]}>
                <Text style={[styles.typeChipIcon, type === "natural" && { color: "#fff" }]}>
                  🌿
                </Text>
                <Text style={[styles.typeChipLabel, type === "natural" && { color: "#fff" }]}>
                  Naturel
                </Text>
              </View>
              <View style={[styles.typeChip, type === "ai" && styles.typeChipSelected]}>
                <Text style={[styles.typeChipIcon, type === "ai" && { color: "#fff" }]}>
                  🧪
                </Text>
                <Text style={[styles.typeChipLabel, type === "ai" && { color: "#fff" }]}>
                  IA
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Mâle (si naturel) */}
          {type === "natural" && (
            <>
              <SectionTitle index={3} label="Mâle" />
              <View style={styles.fieldGroup}>
                <View style={styles.searchInputWrap}>
                  <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher par nom ou RFID..."
                    placeholderTextColor="#999"
                    value={maleSearch}
                    onChangeText={setMaleSearch}
                  />
                </View>
                <View style={styles.typeRow}>
                  {filteredMales.length === 0 ? (
                    <Text style={styles.noResult}>Aucun mâle trouvé</Text>
                  ) : (
                    filteredMales.map((male) => {
                      const selected = maleId === male.id;
                      return (
                        <Pressable
                          key={male.id}
                          onPress={() => setMaleId(male.id)}
                          style={[styles.typeChip, selected && styles.typeChipSelected]}
                        >
                          <Text style={[styles.typeChipLabel, selected && { color: "#fff" }]}>
                            {male.name}
                          </Text>
                          <Text style={[styles.typeChipRfid, selected && { color: "#ddd" }]}>
                            {male.rfid}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </View>
            </>
          )}

          {/* 4. Semence (si IA) */}
          {type === "ai" && (
            <>
              <SectionTitle index={3} label="Référence semence" />
              <View style={styles.fieldGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: SEM-12345"
                  placeholderTextColor="#aaa"
                  value={semenReference}
                  onChangeText={setSemenReference}
                />
              </View>
            </>
          )}

          {/* 5. Résultat */}
          <SectionTitle index={4} label="Résultat" />
          <View style={styles.fieldGroup}>
            <View style={styles.typeRow}>
              {["pending", "success", "failure"].map((r) => {
                const selected = result === r;
                const label =
                  r === "pending" ? "⏳ En attente" :
                  r === "success" ? "✅ Réussie" :
                  "❌ Échec";
                return (
                  <Pressable
                    key={r}
                    onPress={() => setResult(r as any)}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                  >
                    <Text style={[styles.typeChipLabel, selected && { color: "#fff" }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 6. Notes */}
          <SectionTitle index={5} label="Notes" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observations..."
              placeholderTextColor="#aaa"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>ANNULER</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="save" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>METTRE À JOUR</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Composant SectionTitle ──
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

// ── Design tokens ──
const GREEN = "#14532d";
const BORDER = "#e5e0d8";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#faf6f1" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: 0,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },

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
  textArea: { minHeight: 80 },

  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#1f2937" },

  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    minWidth: 70,
  },
  typeChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  typeChipIcon: { fontSize: 16, color: "#555" },
  typeChipLabel: { fontSize: 13, fontWeight: "600", color: "#555" },
  typeChipRfid: { fontSize: 10, color: "#999", marginTop: 2 },
  noResult: { color: "#888", fontStyle: "italic", paddingVertical: 8 },

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
  button: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 12, textAlign: "center" },
});