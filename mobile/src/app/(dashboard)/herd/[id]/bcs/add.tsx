import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BcsRadarChart, BcsRadarValues } from "@/components/BcsRadarChart";
import { BcsScoreBadge } from "@/components/BcsScoreBadge";
import { createBcsRecord } from "@/services/animalBcsService";

export default function AddBcsRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animalId = Number(id);
  const router = useRouter();

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [evaluator, setEvaluator] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const [criteria, setCriteria] = useState<BcsRadarValues>({
    spinousProcesses: 3.0,
    transverseProcesses: 3.0,
    eyeMuscle: 3.0,
    fatCover: 3.0,
    tailDock: 3.0,
  });

  const [manualBcsScore, setManualBcsScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Score global calculé comme moyenne des 5 critères
  const calculatedAverage = Number(
    (
      (criteria.spinousProcesses +
        criteria.transverseProcesses +
        criteria.eyeMuscle +
        criteria.fatCover +
        criteria.tailDock) /
      5
    ).toFixed(1)
  );

  const activeBcsScore = manualBcsScore ?? calculatedAverage;

  const handleCriterionChange = (key: keyof BcsRadarValues, val: number) => {
    setCriteria((prev) => ({
      ...prev,
      [key]: val,
    }));
    // Si l'utilisateur ajuste un critère, on repasse sur la moyenne calculée
    setManualBcsScore(null);
  };

  const handleSave = async () => {
    if (!date) {
      Alert.alert("Date requise", "Veuillez entrer une date valide (YYYY-MM-DD).");
      return;
    }

    setSubmitting(true);
    const result = await createBcsRecord({
      animalId,
      bcsScore: activeBcsScore,
      spinousProcesses: criteria.spinousProcesses,
      transverseProcesses: criteria.transverseProcesses,
      eyeMuscle: criteria.eyeMuscle,
      fatCover: criteria.fatCover,
      tailDock: criteria.tailDock,
      date,
      evaluator: evaluator.trim() || undefined,
      notes: notes.trim() || undefined,
      nutritionalRecommendation: recommendation.trim() || undefined,
    });
    setSubmitting(false);

    if (result.success) {
      Alert.alert("Succès", "Évaluation BCS enregistrée avec succès !", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Erreur", result.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* CARTE RADAR & SCORE ACTIF */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Évaluation anatomique (Échelle 1 à 5)</Text>

          <View style={styles.badgeRow}>
            <BcsScoreBadge score={activeBcsScore} size="lg" />
          </View>

          {/* Graphique Radar 5 axes */}
          <BcsRadarChart
            values={criteria}
            showIdealOverlay={true}
            interactive={true}
            onValueChange={handleCriterionChange}
            size={280}
          />

          <Text style={styles.radarLegend}>
            🟢 Ligne pointillée : Niveau idéal (Score 3.0)
          </Text>
        </View>

        {/* RACCOURCIS RAPIDES SCORE GLOBAL */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ajustement rapide du Score Global</Text>
          <View style={styles.scoreButtonsRow}>
            {[1.0, 2.0, 3.0, 4.0, 5.0].map((scoreVal) => (
              <Pressable
                key={scoreVal}
                onPress={() => {
                  setManualBcsScore(scoreVal);
                  setCriteria({
                    spinousProcesses: scoreVal,
                    transverseProcesses: scoreVal,
                    eyeMuscle: scoreVal,
                    fatCover: scoreVal,
                    tailDock: scoreVal,
                  });
                }}
                style={[
                  styles.scorePill,
                  activeBcsScore === scoreVal && styles.scorePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.scorePillText,
                    activeBcsScore === scoreVal && styles.scorePillTextActive,
                  ]}
                >
                  {scoreVal.toFixed(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* INFORMATIONS DE L'ÉVALUATION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails de la consultation</Text>

          <Text style={styles.label}>Date d'évaluation *</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Évaluateur (Vétérinaire / Éleveur)</Text>
          <TextInput
            style={styles.input}
            value={evaluator}
            onChangeText={setEvaluator}
            placeholder="Ex: Dr. Martin (Vétérinaire)"
          />

          <Text style={styles.label}>Remarques / Observations</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ex: Épine dorsale bien couverte, bon tonus musculaire..."
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Recommandations nutritionnelles</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={recommendation}
            onChangeText={setRecommendation}
            placeholder="Ex: Augmenter les concentrés de 150g/jour post-lactation."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* BOUTON D'ENREGISTREMENT */}
        <Pressable
          onPress={handleSave}
          disabled={submitting}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { opacity: 0.8 },
            submitting && { backgroundColor: "#9CA3AF" },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer le BCS</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const PAGE_BG = "#FAF3EA";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backButtonText: { fontSize: 28, color: "#111827" },
  container: { padding: 16, gap: 16, paddingTop: 4, paddingBottom: 40 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F2A1D",
    marginBottom: 12,
  },
  badgeRow: {
    alignItems: "center",
    marginBottom: 10,
  },
  radarLegend: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  scoreButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  scorePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scorePillActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  scorePillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  scorePillTextActive: {
    color: "#FFFFFF",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
