import { useState } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { createWeightRecord } from "@/services/animalWeightsService";

export default function AddWeightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animalId = Number(id);
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(today);
  const [bcs, setBcs] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!weight || Number.isNaN(Number(weight)) || Number(weight) <= 0) {
      return "Le poids est requis et doit être un nombre positif.";
    }
    if (!date) return "La date est requise.";
    if (bcs && (Number.isNaN(Number(bcs)) || Number(bcs) < 0 || Number(bcs) > 5)) {
      return "Le BCS doit être entre 0 et 5.";
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      Alert.alert("Erreur", validationError);
      return;
    }

    setSubmitting(true);
    const result = await createWeightRecord({
      animalId,
      weight: Number(weight),
      bcs: bcs ? Number(bcs) : undefined,
      date,
      note: note || undefined,
    });
    setSubmitting(false);

    if (result.success) {
      Alert.alert("Succès", "Pesée enregistrée.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Weight */}
        <Text style={styles.label}>Poids (kg) *</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: 45.50"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />

        {/* Date */}
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        {/* BCS */}
        <Text style={styles.label}>BCS (1.0 - 5.0)</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: 3.0"
          value={bcs}
          onChangeText={setBcs}
          keyboardType="decimal-pad"
        />

        {/* Note */}
        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="ex: Pesée après l'alimentation"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />

        {/* Submit */}
        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Enregistrer</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const PAGE_BG = "#faf3ea";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backButtonText: { fontSize: 26, color: "#1a1a1a", fontWeight: "400" },

  container: { padding: 20, paddingTop: 4 },

  label: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  submitButton: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
