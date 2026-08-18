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
import { listAnimals, type Animal } from "../../../services/animalsService";
import { reproductionService } from "../../../services/reproductionService";

export default function AddCycleScreen() {
  const { animalId } = useLocalSearchParams<{ animalId?: string }>();
  const preselectedAnimalId = animalId ? parseInt(animalId) : null;
  const router = useRouter();

  // États du formulaire
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(preselectedAnimalId);
  const [heatDate, setHeatDate] = useState("");
  const [matingType, setMatingType] = useState<"natural" | "ai">("natural");
  const [maleId, setMaleId] = useState<number | null>(null);
  const [semenReference, setSemenReference] = useState("");
  const [notes, setNotes] = useState("");

  // Recherche
  const [femaleSearch, setFemaleSearch] = useState("");
  const [maleSearch, setMaleSearch] = useState("");

  // Listes complètes
  const [allFemales, setAllFemales] = useState<{ id: number; name: string; rfid: string }[]>([]);
  const [allMales, setAllMales] = useState<{ id: number; name: string; rfid: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Chargement des animaux
  useEffect(() => {
    loadAnimals();
  }, []);

  async function loadAnimals() {
    setLoading(true);
    try {
      const femaleResult = await listAnimals({ sex: "FEMALE" });
      if (femaleResult.success) {
        const list = femaleResult.data || [];
        setAllFemales(list.map((a: Animal) => ({ id: a.id, name: a.name, rfid: a.rfid })));
        if (!preselectedAnimalId && list.length > 0) {
          setSelectedAnimalId(list[0].id);
        }
      }

      const maleResult = await listAnimals({ sex: "MALE" });
      if (maleResult.success) {
        setAllMales((maleResult.data || []).map((a: Animal) => ({ id: a.id, name: a.name, rfid: a.rfid })));
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les animaux.");
    } finally {
      setLoading(false);
    }
  }

  // Filtrage des femelles
  const filteredFemales = useMemo(() => {
    const q = femaleSearch.trim().toLowerCase();
    if (!q) return allFemales;
    return allFemales.filter(
      (f) => f.name.toLowerCase().includes(q) || f.rfid.toLowerCase().includes(q)
    );
  }, [allFemales, femaleSearch]);

  // Filtrage des mâles
  const filteredMales = useMemo(() => {
    const q = maleSearch.trim().toLowerCase();
    if (!q) return allMales;
    return allMales.filter(
      (m) => m.name.toLowerCase().includes(q) || m.rfid.toLowerCase().includes(q)
    );
  }, [allMales, maleSearch]);

  // Soumission
  async function handleSubmit() {
    if (!selectedAnimalId) {
      Alert.alert("Erreur", "Veuillez sélectionner une femelle.");
      return;
    }
    if (!heatDate) {
      Alert.alert("Erreur", "La date de chaleur est requise.");
      return;
    }

    setSubmitting(true);
    try {
      await reproductionService.createCycle({
        animalId: selectedAnimalId,
        heatDate,
        matingType,
        maleId: matingType === "natural" ? maleId : null,
        semenReference: matingType === "ai" ? semenReference : null,
        notes: notes || null,
      });
      Alert.alert("Succès", "Cycle ajouté avec succès.");
      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter le cycle.");
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
          {/* ---- Sélection de la femelle avec recherche ---- */}
          <SectionTitle index={1} label="Femelle" />

          <View style={styles.fieldGroup}>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher par nom ou RFID..."
                placeholderTextColor="#999"
                value={femaleSearch}
                onChangeText={setFemaleSearch}
              />
            </View>
            <View style={styles.typeRow}>
              {filteredFemales.length === 0 ? (
                <Text style={styles.noResult}>Aucune femelle trouvée</Text>
              ) : (
                filteredFemales.map((female) => {
                  const selected = selectedAnimalId === female.id;
                  return (
                    <Pressable
                      key={female.id}
                      onPress={() => setSelectedAnimalId(female.id)}
                      style={[styles.typeChip, selected && styles.typeChipSelected]}
                    >
                      <Text style={[styles.typeChipLabel, selected && { color: "#fff" }]}>
                        {female.name}
                      </Text>
                      <Text style={[styles.typeChipRfid, selected && { color: "#ddd" }]}>
                        {female.rfid}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>

          {/* ---- Date de chaleur ---- */}
          <SectionTitle index={2} label="Date de chaleur" />

          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (ex: 2026-08-02)"
              placeholderTextColor="#aaa"
              value={heatDate}
              onChangeText={setHeatDate}
            />
          </View>

          {/* ---- Type d'accouplement ---- */}
          <SectionTitle index={3} label="Type d'accouplement" />

          <View style={styles.fieldGroup}>
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setMatingType("natural")}
                style={[styles.typeChip, matingType === "natural" && styles.typeChipSelected]}
              >
                <Text style={[styles.typeChipIcon, matingType === "natural" && { color: "#fff" }]}>
                  🌿
                </Text>
                <Text style={[styles.typeChipLabel, matingType === "natural" && { color: "#fff" }]}>
                  Naturel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMatingType("ai")}
                style={[styles.typeChip, matingType === "ai" && styles.typeChipSelected]}
              >
                <Text style={[styles.typeChipIcon, matingType === "ai" && { color: "#fff" }]}>
                  🧪
                </Text>
                <Text style={[styles.typeChipLabel, matingType === "ai" && { color: "#fff" }]}>
                  IA
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ---- Sélection du mâle avec recherche (si naturel) ---- */}
          {matingType === "natural" && (
            <>
              <SectionTitle index={4} label="Mâle" />
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

          {/* ---- Référence semence (si IA) ---- */}
          {matingType === "ai" && (
            <>
              <SectionTitle index={4} label="Référence semence" />
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

          {/* ---- Notes ---- */}
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

          {/* ---- Boutons ---- */}
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
                  <Text style={styles.buttonText}>AJOUTER LE CYCLE</Text>
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