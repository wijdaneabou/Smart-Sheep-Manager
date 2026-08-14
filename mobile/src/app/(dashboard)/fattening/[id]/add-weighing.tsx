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
import { Ionicons } from "@expo/vector-icons";

import { createBatchWeightRecord } from "../../../../services/fatteningService";

export default function AddBatchWeighingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const batchId = Number(id);

  const today = new Date().toISOString().split("T")[0];

  const [averageWeight, setAverageWeight] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!averageWeight || Number.isNaN(Number(averageWeight)) || Number(averageWeight) <= 0) {
      return "Le poids moyen est requis et doit être un nombre positif.";
    }
    if (!date) return "La date est requise.";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      Alert.alert("Erreur", validationError);
      return;
    }

    setSubmitting(true);
    const result = await createBatchWeightRecord({
      fatteningBatchId: batchId,
      averageWeight: Number(averageWeight),
      date,
      note: note || null,
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
          <Ionicons name="arrow-back" size={22} color="#14532d" />
        </Pressable>
        <Text style={styles.headerTitle}>Nouvelle pesée</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Poids moyen du lot (kg) *</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: 38.50"
          value={averageWeight}
          onChangeText={setAverageWeight}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.label}>Note (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="ex: Pesée après alimentation"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />

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

const GREEN = "#14532d";

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
  container: { padding: 20, paddingTop: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e0d8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
    marginBottom: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  submitButton: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
