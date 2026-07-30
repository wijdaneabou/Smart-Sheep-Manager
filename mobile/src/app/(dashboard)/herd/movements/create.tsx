import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  createMovement,
  type MovementType,
} from "@/services/animalMovementsService";
import {
  MOVEMENT_TYPES,
  getMovementTypeInfo,
  type MovementTypeInfo,
} from "@/constants/movements";

export default function CreateMovementScreen() {
  const router = useRouter();

  const [animalId, setAnimalId] = useState("");
  const [type, setType] = useState<MovementType>("ENTRY");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [sourceDestination, setSourceDestination] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!animalId || !date) {
      Alert.alert("Erreur", "Veuillez remplir l'ID de l'animal et la date.");
      return;
    }

    setSubmitting(true);
    const result = await createMovement({
      animalId: Number(animalId),
      type,
      date,
      reason: reason || undefined,
      sourceDestination: sourceDestination || undefined,
      price: price ? Number(price) : undefined,
    });
    setSubmitting(false);

    if (result.success) {
      Alert.alert("Succès", "Mouvement enregistré.", [
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
        <Text style={styles.headerTitle}>Nouveau mouvement</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Movement type selector */}
        <Text style={styles.sectionLabel}>Type de mouvement</Text>
        <View style={styles.typeSelector}>
          {MOVEMENT_TYPES.map((t: MovementTypeInfo) => {
            const isSelected = type === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setType(t.id)}
                style={[
                  styles.typeOption,
                  isSelected && { backgroundColor: t.bgColor, borderColor: t.color },
                ]}
              >
                <Text style={styles.typeOptionIcon}>{t.icon}</Text>
                <Text style={[styles.typeOptionLabel, isSelected && { color: t.color, fontWeight: "700" }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Animal ID */}
        <Text style={styles.label}>ID de l'animal *</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: 1"
          value={animalId}
          onChangeText={setAnimalId}
          keyboardType="numeric"
        />

        {/* Date */}
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        {/* Reason */}
        <Text style={styles.label}>Raison</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="ex: Vente à un autre éleveur"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />

        {/* Source / Destination */}
        <Text style={styles.label}>Provenance / Destination</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: Élever de Sardi, Taza"
          value={sourceDestination}
          onChangeText={setSourceDestination}
        />

        {/* Price */}
        <Text style={styles.label}>Prix (€)</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: 1200.00"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
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
  headerTitle: { fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },

  container: { padding: 20, paddingTop: 8 },

  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },

  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  typeOptionIcon: { fontSize: 14 },
  typeOptionLabel: { fontSize: 12, color: "#555" },

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
