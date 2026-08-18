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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { reproductionService } from "../../../../services/reproductionService";

export default function EditPregnancyScreen() {
  const { animalId, cycleId } = useLocalSearchParams<{
    animalId: string;
    cycleId: string;
  }>();
  const router = useRouter();
  const id = parseInt(cycleId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [expectedLambingDate, setExpectedLambingDate] = useState("");
  const [ultrasoundNotes, setUltrasoundNotes] = useState("");
  const [lambingDate, setLambingDate] = useState("");
  const [lambingType, setLambingType] = useState<"single" | "multiple" | "">("");
  const [liveBorn, setLiveBorn] = useState("");
  const [stillBorn, setStillBorn] = useState("");

  // Charger les données du cycle
  useEffect(() => {
    async function loadCycle() {
      setLoading(true);
      try {
        const res = await reproductionService.getCycleById(id);
        const cycle = res.data.data;
        setExpectedLambingDate(cycle.expectedLambingDate || "");
        setUltrasoundNotes(cycle.ultrasoundNotes || "");
        setLambingDate(cycle.lambingDate || "");
        setLambingType(cycle.lambingType || "");
        setLiveBorn(cycle.liveBorn?.toString() || "");
        setStillBorn(cycle.stillBorn?.toString() || "");
      } catch (error) {
        Alert.alert("Erreur", "Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    }
    loadCycle();
  }, [id]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await reproductionService.updatePregnancy(id, {
        expectedLambingDate: expectedLambingDate || undefined,
        ultrasoundNotes: ultrasoundNotes || undefined,
        lambingDate: lambingDate || undefined,
        lambingType: lambingType || undefined,
        liveBorn: liveBorn ? parseInt(liveBorn) : undefined,
        stillBorn: stillBorn ? parseInt(stillBorn) : undefined,
      });
      Alert.alert("Succès", "Gestation mise à jour.");
      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour.");
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
          {/* 1. Date de mise bas prévue */}
          <SectionTitle index={1} label="Date de mise bas prévue" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#aaa"
              value={expectedLambingDate}
              onChangeText={setExpectedLambingDate}
            />
          </View>

          {/* 2. Notes échographie */}
          <SectionTitle index={2} label="Notes d'échographie" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observations échographiques..."
              placeholderTextColor="#aaa"
              value={ultrasoundNotes}
              onChangeText={setUltrasoundNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* 3. Date de mise bas réelle */}
          <SectionTitle index={3} label="Date de mise bas (réelle)" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#aaa"
              value={lambingDate}
              onChangeText={setLambingDate}
            />
          </View>

          {/* 4. Type de mise bas */}
          <SectionTitle index={4} label="Type de mise bas" />
          <View style={styles.fieldGroup}>
            <View style={styles.typeRow}>
              {["single", "multiple"].map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setLambingType(type as any)}
                  style={[
                    styles.typeChip,
                    lambingType === type && styles.typeChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipLabel,
                      lambingType === type && { color: "#fff" },
                    ]}
                  >
                    {type === "single" ? "🐑 Simple" : "🐑🐑 Multiple"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 5. Nés vivants */}
          <SectionTitle index={5} label="Nés vivants" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={liveBorn}
              onChangeText={setLiveBorn}
            />
          </View>

          {/* 6. Morts-nés */}
          <SectionTitle index={6} label="Morts-nés" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={stillBorn}
              onChangeText={setStillBorn}
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

  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 12 },
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
  typeChipLabel: { fontSize: 13, fontWeight: "600", color: "#555" },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
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