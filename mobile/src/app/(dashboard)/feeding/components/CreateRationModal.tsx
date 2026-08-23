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
  type FeedItem,
  type FeedRation,
  type TargetType,
} from "../../../../services/feedingService";
import {
  type RationLine,
  initialLines,
  targets,
  NumberBlock,
  ModalHeader,
  Input,
  Chip,
  parseNumber,
} from "./FeedingShared";

type Props = {
  visible: boolean;
  onClose: () => void;
  feedItems: FeedItem[];
  saving: boolean;
  onRationCreated: () => Promise<void>;
};

export default function CreateRationModal({
  visible,
  onClose,
  feedItems,
  saving,
  onRationCreated,
}: Props) {
  const [rationName, setRationName] = useState("");
  const [rationCode, setRationCode] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("TOUS");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<RationLine[]>(initialLines);

  const totalQuantityKg = useMemo(
    () => lines.reduce((total, line) => total + parseNumber(line.quantityKg), 0),
    [lines]
  );

  const estimatedCostPerAnimal = useMemo(() => {
    return lines.reduce((total, line) => {
      const feedItem = feedItems.find((item) => item.id === line.feedItemId);
      if (!feedItem) return total;
      return total + parseNumber(line.quantityKg) * parseNumber(feedItem.unitPrice);
    }, 0);
  }, [feedItems, lines]);

  const estimatedCostPerKg =
    totalQuantityKg > 0 ? estimatedCostPerAnimal / totalQuantityKg : 0;

  function resetForm() {
    setRationName("");
    setRationCode("");
    setTargetType("TOUS");
    setDescription("");
    setLines(initialLines);
  }

  function updateLine(index: number, patch: Partial<RationLine>) {
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line))
    );
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  }

  async function createRation() {
    const validLines = lines.filter(
      (line) => line.feedItemId && parseNumber(line.quantityKg) > 0
    );
    const totalQuantity = validLines.reduce(
      (sum, line) => sum + parseNumber(line.quantityKg),
      0
    );

    if (!rationName.trim()) {
      Alert.alert("Nom requis", "Ajoute un nom pour la ration.");
      return;
    }

    if (validLines.length === 0) {
      Alert.alert("Composition requise", "Ajoute au moins un aliment dans la formule.");
      return;
    }

    if (totalQuantity <= 0) {
      Alert.alert("Quantite requise", "Ajoute une quantite en kg par animal.");
      return;
    }

    try {
      await feedingService.createFeedRation({
        name: rationName.trim(),
        code: rationCode.trim() || undefined,
        targetType,
        dailyRationPerAnimalKg: totalQuantity.toFixed(3),
        costPerKg: estimatedCostPerKg.toFixed(2),
        description: description.trim() || undefined,
        status: "ACTIVE",
        items: validLines.map((line) => {
          const percentage = (parseNumber(line.quantityKg) / totalQuantity) * 100;
          return {
            feedItemId: line.feedItemId!,
            percentage: percentage.toFixed(2),
            quantityKgPerTon: (percentage * 10).toFixed(2),
          };
        }),
      } as Partial<FeedRation>);
      resetForm();
      await onRationCreated();
      onClose();
    } catch (err: any) {
      Alert.alert(
        "Creation impossible",
        err?.response?.data?.message || "Verifie les donnees."
      );
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalSafeArea}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <ModalHeader title="Creer une ration" onClose={onClose} />

          <View style={styles.formCard}>
            <Input
              label="Nom de la ration"
              value={rationName}
              onChangeText={setRationName}
              placeholder="Ration croissance"
            />
            <Input
              label="Code"
              value={rationCode}
              onChangeText={setRationCode}
              placeholder="RAT-001"
            />
            <Text style={styles.inputLabel}>Cible</Text>
            <View style={styles.chipWrap}>
              {targets.map((target) => (
                <Chip
                  key={target.value}
                  label={target.label}
                  active={targetType === target.value}
                  onPress={() => setTargetType(target.value)}
                />
              ))}
            </View>

            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Objectif, periode, remarques..."
              multiline
            />
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeaderRow}>
              <View>
                <Text style={styles.formTitle}>Composition simple</Text>
                <Text style={styles.formSubtitle}>
                  Saisir seulement la quantite par animal.
                </Text>
              </View>
              <Text style={styles.percentOk}>{totalQuantityKg.toFixed(2)} kg/j</Text>
            </View>

            {lines.map((line, index) => (
              <View key={index} style={styles.lineCard}>
                <View style={styles.formHeaderRow}>
                  <Text style={styles.lineTitle}>Composant {index + 1}</Text>
                  {lines.length > 1 ? (
                    <Pressable onPress={() => removeLine(index)}>
                      <Ionicons name="trash-outline" size={19} color="#B42318" />
                    </Pressable>
                  ) : null}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.feedPicker}
                >
                  {feedItems.map((item) => (
                    <Chip
                      key={item.id}
                      label={item.name}
                      active={line.feedItemId === item.id}
                      onPress={() => updateLine(index, { feedItemId: item.id })}
                    />
                  ))}
                </ScrollView>

                <Input
                  label="Quantite par animal (kg/j)"
                  value={line.quantityKg}
                  onChangeText={(value) => updateLine(index, { quantityKg: value })}
                  keyboardType="decimal-pad"
                  placeholder="0.5"
                />
                <Text style={styles.lineHint}>
                  {totalQuantityKg > 0
                    ? `${((parseNumber(line.quantityKg) / totalQuantityKg) * 100).toFixed(0)}% calcule automatiquement`
                    : "Le pourcentage sera calcule automatiquement"}
                </Text>
              </View>
            ))}

            <Pressable
              style={styles.addLineButton}
              onPress={() =>
                setLines((current) => [...current, { feedItemId: null, quantityKg: "" }])
              }
            >
              <Ionicons name="add" size={18} color="#17633A" />
              <Text style={styles.addLineText}>Ajouter un composant</Text>
            </Pressable>
          </View>

          <View style={styles.costPreview}>
            <NumberBlock
              label="Cout estime/kg"
              value={`${estimatedCostPerKg.toFixed(2)} DH`}
            />
            <NumberBlock
              label="Cout/ration/animal"
              value={`${estimatedCostPerAnimal.toFixed(2)} DH`}
            />
          </View>

          <Pressable
            style={[styles.submitButton, saving && styles.disabledButton]}
            onPress={createRation}
            disabled={saving}
          >
            <Text style={styles.submitButtonText}>
              {saving ? "Creation..." : "Enregistrer la ration"}
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
  formHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  formTitle: {
    color: "#10281D",
    fontSize: 17,
    fontWeight: "900",
  },
  formSubtitle: {
    color: "#5C7468",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  percentOk: {
    color: "#17633A",
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
  lineCard: {
    borderRadius: 8,
    backgroundColor: "#F7FCF8",
    borderWidth: 1,
    borderColor: "#DCEBE2",
    padding: 12,
    gap: 10,
  },
  lineTitle: {
    color: "#10281D",
    fontSize: 14,
    fontWeight: "900",
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
  addLineButton: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#A9D2B9",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  addLineText: {
    color: "#17633A",
    fontSize: 14,
    fontWeight: "900",
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
