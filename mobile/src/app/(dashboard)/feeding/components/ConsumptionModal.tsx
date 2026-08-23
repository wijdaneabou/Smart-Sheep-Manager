import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import feedingService, {
  type FeedRation,
  type TimeOfDay,
  type DistributionTargetType,
} from "../../../../services/feedingService";
import {
  NumberBlock,
  ModalHeader,
  Input,
  Chip,
  parseNumber,
} from "./FeedingShared";

type Props = {
  visible: boolean;
  onClose: () => void;
  rations: FeedRation[];
  saving: boolean;
  onDistributionCreated: () => Promise<void>;
};

export default function ConsumptionModal({
  visible,
  onClose,
  rations,
  saving,
  onDistributionCreated,
}: Props) {
  const [distributionRationId, setDistributionRationId] = useState<number | null>(
    rations[0]?.id ?? null
  );
  const [distributionDate, setDistributionDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [distributionTargetType, setDistributionTargetType] =
    useState<DistributionTargetType>("BATCH");
  const [distributionBatchName, setDistributionBatchName] = useState(
    "Troupeau principal"
  );
  const [distributionTimeOfDay, setDistributionTimeOfDay] =
    useState<TimeOfDay>("ALL_DAY");
  const [distributedKg, setDistributedKg] = useState("");
  const [refusedKg, setRefusedKg] = useState("0");
  const [numberOfAnimals, setNumberOfAnimals] = useState("");

  const formConsumedKg = useMemo(
    () => Math.max(parseNumber(distributedKg) - parseNumber(refusedKg), 0),
    [distributedKg, refusedKg]
  );

  const formConsumptionPerAnimal = useMemo(
    () =>
      parseNumber(numberOfAnimals) > 0
        ? formConsumedKg / parseNumber(numberOfAnimals)
        : 0,
    [numberOfAnimals, formConsumedKg]
  );

  function resetForm() {
    setDistributionRationId(rations[0]?.id ?? null);
    setDistributionDate(new Date().toISOString().slice(0, 10));
    setDistributionTargetType("BATCH");
    setDistributionBatchName("Troupeau principal");
    setDistributionTimeOfDay("ALL_DAY");
    setDistributedKg("");
    setRefusedKg("0");
    setNumberOfAnimals("");
  }

  async function createConsumptionRecord() {
    if (parseNumber(distributedKg) <= 0) {
      Alert.alert("Quantite requise", "Ajoute la quantite distribuee en kg.");
      return;
    }

    if (parseNumber(refusedKg) > parseNumber(distributedKg)) {
      Alert.alert(
        "Refus invalide",
        "Le refus ne peut pas depasser la quantite distribuee."
      );
      return;
    }

    if (parseNumber(numberOfAnimals) <= 0) {
      Alert.alert("Nombre requis", "Ajoute le nombre d'animaux concernes.");
      return;
    }

    try {
      await feedingService.createFeedDistribution({
        rationId: distributionRationId || undefined,
        targetType: distributionTargetType,
        batchName:
          distributionTargetType === "BATCH" || distributionTargetType === "LOT"
            ? distributionBatchName.trim() || "Troupeau"
            : undefined,
        distributionDate: new Date(
          `${distributionDate}T12:00:00`
        ).toISOString(),
        timeOfDay: distributionTimeOfDay,
        quantityDistributedKg: String(parseNumber(distributedKg)),
        refusedQuantityKg: String(parseNumber(refusedKg)),
        numberOfAnimals: Math.round(parseNumber(numberOfAnimals)),
        weatherConditions: "BON",
        notes: `Consomme: ${formConsumedKg.toFixed(2)} kg; par animal: ${formConsumptionPerAnimal.toFixed(2)} kg/j`,
      });
      resetForm();
      await onDistributionCreated();
      onClose();
    } catch (err: any) {
      Alert.alert(
        "Enregistrement impossible",
        err?.response?.data?.message || "Verifie les donnees."
      );
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalSafeArea}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <ModalHeader title="Suivi consommation" onClose={onClose} />
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Ration distribuee</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.feedPicker}
            >
              {rations.map((ration) => (
                <Chip
                  key={ration.id}
                  label={ration.name}
                  active={distributionRationId === ration.id}
                  onPress={() => setDistributionRationId(ration.id)}
                />
              ))}
            </ScrollView>
            {rations.length === 0 ? (
              <Text style={styles.lineHint}>
                Tu peux enregistrer une consommation sans ration, puis creer la
                ration apres.
              </Text>
            ) : null}

            <Input
              label="Date"
              value={distributionDate}
              onChangeText={setDistributionDate}
              placeholder="2026-08-06"
            />
            <Input
              label="Lot ou groupe"
              value={distributionBatchName}
              onChangeText={setDistributionBatchName}
              placeholder="Troupeau principal"
            />

            <Text style={styles.inputLabel}>Moment</Text>
            <View style={styles.chipWrap}>
              <Chip
                label="Journee"
                active={distributionTimeOfDay === "ALL_DAY"}
                onPress={() => setDistributionTimeOfDay("ALL_DAY")}
              />
              <Chip
                label="Matin"
                active={distributionTimeOfDay === "MORNING"}
                onPress={() => setDistributionTimeOfDay("MORNING")}
              />
              <Chip
                label="Midi"
                active={distributionTimeOfDay === "MIDDAY"}
                onPress={() => setDistributionTimeOfDay("MIDDAY")}
              />
              <Chip
                label="Soir"
                active={distributionTimeOfDay === "EVENING"}
                onPress={() => setDistributionTimeOfDay("EVENING")}
              />
            </View>

            <Text style={styles.inputLabel}>Cible</Text>
            <View style={styles.chipWrap}>
              <Chip
                label="Groupe"
                active={distributionTargetType === "BATCH"}
                onPress={() => setDistributionTargetType("BATCH")}
              />
              <Chip
                label="Lot"
                active={distributionTargetType === "LOT"}
                onPress={() => setDistributionTargetType("LOT")}
              />
              <Chip
                label="Batiment"
                active={distributionTargetType === "BATIMENT"}
                onPress={() => setDistributionTargetType("BATIMENT")}
              />
            </View>

            <Input
              label="Nombre d'animaux"
              value={numberOfAnimals}
              onChangeText={setNumberOfAnimals}
              keyboardType="decimal-pad"
              placeholder="25"
            />
            <Input
              label="Quantite distribuee (kg)"
              value={distributedKg}
              onChangeText={setDistributedKg}
              keyboardType="decimal-pad"
              placeholder="40"
            />
            <Input
              label="Refus apres repas (kg)"
              value={refusedKg}
              onChangeText={setRefusedKg}
              keyboardType="decimal-pad"
              placeholder="2"
            />
          </View>

          <View style={styles.costPreview}>
            <NumberBlock
              label="Consomme"
              value={`${formConsumedKg.toFixed(2)} kg`}
            />
            <NumberBlock
              label="Par animal/j"
              value={`${formConsumptionPerAnimal.toFixed(2)} kg`}
            />
          </View>

          <Pressable
            style={[styles.submitButton, saving && styles.disabledButton]}
            onPress={createConsumptionRecord}
            disabled={saving}
          >
            <Text style={styles.submitButtonText}>
              {saving ? "Enregistrement..." : "Enregistrer le suivi"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#F5FAF6",
  },
  modalContent: {
    padding: 18,
    paddingBottom: 34,
    gap: 14,
  },
  formCard: {
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
    padding: 14,
    gap: 12,
  },
  inputLabel: {
    color: "#2B4638",
    fontSize: 13,
    fontWeight: "800",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCEBE2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "#17633A",
    borderColor: "#17633A",
  },
  chipText: {
    color: "#2B4638",
    fontSize: 13,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  feedPicker: {
    gap: 8,
    paddingRight: 8,
  },
  lineHint: {
    color: "#5C7468",
    fontSize: 12,
    fontWeight: "700",
  },
  costPreview: {
    flexDirection: "row",
    gap: 10,
  },
  submitButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: "#17633A",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.65,
  },
});
