import { useState } from "react";
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

type Lamb = {
  sex: "MALE" | "FEMALE";
  weight?: string;
  name?: string;
  birthDate?: string;
};

// ── Design tokens ──
const GREEN = "#14532d";
const BORDER = "#e5e0d8";
const TEXT_DARK = "#1f2937"; // ✅ Ajout de la constante manquante

export default function RecordLambingScreen() {
  const { animalId, cycleId } = useLocalSearchParams<{
    animalId: string;
    cycleId: string;
  }>();
  const router = useRouter();
  const id = parseInt(cycleId);

  const [lambingDate, setLambingDate] = useState("");
  const [lambingType, setLambingType] = useState<"single" | "multiple" | "">("");
  const [liveBorn, setLiveBorn] = useState("");
  const [stillBorn, setStillBorn] = useState("");
  const [lambs, setLambs] = useState<Lamb[]>([{ sex: "FEMALE", weight: "", name: "" }]);

  const [submitting, setSubmitting] = useState(false);

  const addLamb = () => {
    setLambs([...lambs, { sex: "FEMALE", weight: "", name: "" }]);
  };

  const removeLamb = (index: number) => {
    if (lambs.length === 1) {
      Alert.alert("Info", "Il doit y avoir au moins un agneau.");
      return;
    }
    const newLambs = [...lambs];
    newLambs.splice(index, 1);
    setLambs(newLambs);
  };

  const updateLamb = (index: number, field: keyof Lamb, value: string) => {
    const newLambs = [...lambs];
    newLambs[index] = { ...newLambs[index], [field]: value };
    setLambs(newLambs);
  };

  async function handleSubmit() {
    if (!lambingDate) {
      Alert.alert("Erreur", "La date de mise bas est requise.");
      return;
    }
    if (!lambingType) {
      Alert.alert("Erreur", "Veuillez sélectionner le type de mise bas.");
      return;
    }
    const live = parseInt(liveBorn) || 0;
    const still = parseInt(stillBorn) || 0;
    if (live + still === 0) {
      Alert.alert("Erreur", "Au moins un agneau (vivant ou mort-né) doit être enregistré.");
      return;
    }

    const lambsData = lambs
      .filter(l => l.sex)
      .map(l => ({
        sex: l.sex,
        weight: l.weight ? parseFloat(l.weight) : undefined,
        name: l.name || undefined,
        birthDate: l.birthDate || undefined,
      }));

    setSubmitting(true);
    try {
      await reproductionService.recordLambing(id, {
        lambingDate,
        lambingType: lambingType as "single" | "multiple",
        liveBorn: live,
        stillBorn: still,
        lambs: lambsData.length > 0 ? lambsData : undefined,
      });
      Alert.alert("Succès", "Mise bas enregistrée avec succès.");
      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'enregistrer la mise bas.");
    } finally {
      setSubmitting(false);
    }
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
          {/* 1. Date de mise bas */}
          <SectionTitle index={1} label="Date de mise bas" />
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#aaa"
              value={lambingDate}
              onChangeText={setLambingDate}
            />
          </View>

          {/* 2. Type */}
          <SectionTitle index={2} label="Type de mise bas" />
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

          {/* 3. Nombre de vivants et morts-nés */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.label}>Nés vivants</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={liveBorn}
                onChangeText={setLiveBorn}
              />
            </View>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.label}>Morts-nés</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={stillBorn}
                onChangeText={setStillBorn}
              />
            </View>
          </View>

          {/* 4. Liste des agneaux (si multiple) */}
          {lambingType === "multiple" && (
            <>
              <SectionTitle index={3} label="Agneaux (vivants)" />
              {lambs.map((lamb, index) => (
                <View key={index} style={styles.lambCard}>
                  <View style={styles.lambHeader}>
                    <Text style={styles.lambTitle}>Agneau #{index + 1}</Text>
                    <Pressable onPress={() => removeLamb(index)}>
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </Pressable>
                  </View>

                  {/* Sexe */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Sexe</Text>
                    <View style={styles.typeRow}>
                      {["MALE", "FEMALE"].map((s) => (
                        <Pressable
                          key={s}
                          onPress={() => updateLamb(index, "sex", s as any)}
                          style={[
                            styles.typeChip,
                            lamb.sex === s && styles.typeChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeChipLabel,
                              lamb.sex === s && { color: "#fff" },
                            ]}
                          >
                            {s === "MALE" ? "♂ Mâle" : "♀ Femelle"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Poids */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Poids (kg)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 4.2"
                      keyboardType="decimal-pad"
                      value={lamb.weight}
                      onChangeText={(v) => updateLamb(index, "weight", v)}
                    />
                  </View>

                  {/* Nom */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Nom</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Optionnel"
                      value={lamb.name}
                      onChangeText={(v) => updateLamb(index, "name", v)}
                    />
                  </View>
                </View>
              ))}

              <Pressable onPress={addLamb} style={styles.addButton}>
                <Ionicons name="add-circle-outline" size={24} color={GREEN} />
                <Text style={styles.addButtonText}>Ajouter un agneau</Text>
              </Pressable>
            </>
          )}

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
                  <Text style={styles.buttonText}>ENREGISTRER</Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#faf6f1" },
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
  sectionTitle: { fontSize: 14, fontWeight: "700", color: TEXT_DARK },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
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
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
  },
  typeChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  typeChipLabel: { fontSize: 13, fontWeight: "600", color: "#555" },
  lambCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  lambHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  lambTitle: { fontSize: 15, fontWeight: "700", color: TEXT_DARK },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 10,
    borderStyle: "dashed",
    marginBottom: 12,
  },
  addButtonText: { color: GREEN, fontWeight: "600", marginLeft: 8 },
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