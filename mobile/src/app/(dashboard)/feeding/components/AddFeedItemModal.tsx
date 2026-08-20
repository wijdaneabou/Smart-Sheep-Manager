import { useState } from "react";
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
import feedingService, { type FeedCategory } from "../../../../services/feedingService";
import { ModalHeader, Input, Chip, categories } from "./FeedingShared";

type Props = {
  visible: boolean;
  onClose: () => void;
  saving: boolean;
  onItemCreated: () => Promise<void>;
};

export default function AddFeedItemModal({
  visible,
  onClose,
  saving,
  onItemCreated,
}: Props) {
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<FeedCategory>("FOURRAGE");
  const [itemPrice, setItemPrice] = useState("");
  const [itemStock, setItemStock] = useState("");

  function resetForm() {
    setItemName("");
    setItemCategory("FOURRAGE");
    setItemPrice("");
    setItemStock("");
  }

  async function createFeedItem() {
    if (!itemName.trim()) {
      Alert.alert("Nom requis", "Ajoute le nom de l'aliment.");
      return;
    }

    try {
      await feedingService.createFeedItem({
        name: itemName.trim(),
        category:
          itemCategory === ("SILAGE" as FeedCategory) ? "FOURRAGE" : itemCategory,
        unit: "KG",
        unitPrice: String(parseFloat(itemPrice || "0")),
        currentStock: String(parseFloat(itemStock || "0")),
        minStockThreshold: "0",
      });
      resetForm();
      await onItemCreated();
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
          <ModalHeader title="Nouvel aliment" onClose={onClose} />
          <View style={styles.formCard}>
            <Input
              label="Nom"
              value={itemName}
              onChangeText={setItemName}
              placeholder="Foin de luzerne"
            />
            <Text style={styles.inputLabel}>Categorie</Text>
            <View style={styles.chipWrap}>
              {categories.map((category) => (
                <Chip
                  key={category.value}
                  label={category.label}
                  active={itemCategory === category.value}
                  onPress={() => setItemCategory(category.value)}
                />
              ))}
            </View>
            <Input
              label="Prix unitaire DH/kg"
              value={itemPrice}
              onChangeText={setItemPrice}
              keyboardType="decimal-pad"
              placeholder="2.50"
            />
            <Input
              label="Stock actuel kg"
              value={itemStock}
              onChangeText={setItemStock}
              keyboardType="decimal-pad"
              placeholder="500"
            />
          </View>
          <Pressable
            style={[styles.submitButton, saving && styles.disabledButton]}
            onPress={createFeedItem}
            disabled={saving}
          >
            <Text style={styles.submitButtonText}>
              {saving ? "Creation..." : "Enregistrer l'aliment"}
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
