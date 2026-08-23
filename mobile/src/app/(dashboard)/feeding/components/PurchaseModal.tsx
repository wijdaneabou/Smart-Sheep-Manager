import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import feedingService, { type FeedItem, type FeedCategory } from "../../../../services/feedingService";
import { ModalHeader, Input, Chip, categories } from "./FeedingShared";

type Props = {
  visible: boolean;
  onClose: () => void;
  feedItems: FeedItem[];
  saving: boolean;
  onPurchaseCreated: () => Promise<void>;
};

export default function PurchaseModal({
  visible,
  onClose,
  feedItems,
  saving,
  onPurchaseCreated,
}: Props) {
  const [feedItemId, setFeedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unitPurchasePrice, setUnitPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FeedCategory>("FOURRAGE");

  const filteredItems = feedItems.filter(
    (item) => item.category === selectedCategory
  );

  function resetForm() {
    setFeedItemId(null);
    setQuantity("");
    setUnitPurchasePrice("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setBatchNumber("");
    setExpiryDate("");
    setSupplier("");
    setNotes("");
    setSelectedCategory("FOURRAGE");
  }

  async function createPurchase() {
    if (!feedItemId) {
      Alert.alert("Aliment requis", "Selectionne un aliment.");
      return;
    }

    const qty = parseFloat(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      Alert.alert("Quantite invalide", "Ajoute une quantite positive.");
      return;
    }

    try {
      await feedingService.createPurchase({
        feedItemId,
        quantity: String(qty),
        unitPurchasePrice: unitPurchasePrice || undefined,
        purchaseDate,
        batchNumber: batchNumber || undefined,
        expiryDate: expiryDate || undefined,
        supplier: supplier || undefined,
        notes: notes || undefined,
      });
      resetForm();
      await onPurchaseCreated();
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
          <ModalHeader title="Nouvel approvisionnement" onClose={onClose} />

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Categorie</Text>
            <View style={styles.chipWrap}>
              {categories.map((category) => (
                <Chip
                  key={category.value}
                  label={category.label}
                  active={selectedCategory === category.value}
                  onPress={() => {
                    setSelectedCategory(category.value);
                    setFeedItemId(null);
                  }}
                />
              ))}
            </View>

            <Text style={styles.inputLabel}>Aliment</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.feedPicker}
            >
              {filteredItems.map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  active={feedItemId === item.id}
                  onPress={() => setFeedItemId(item.id)}
                />
              ))}
            </ScrollView>
            {filteredItems.length === 0 ? (
              <Text style={styles.hint}>Aucun aliment dans cette categorie.</Text>
            ) : null}

            <Input
              label="Quantite (kg)"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder="100"
            />
            <Input
              label="Prix d'achat DH/kg"
              value={unitPurchasePrice}
              onChangeText={setUnitPurchasePrice}
              keyboardType="decimal-pad"
              placeholder="2.50"
            />
            <Input
              label="Date d'achat"
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              placeholder="2026-08-12"
            />
            <Input
              label="Fournisseur"
              value={supplier}
              onChangeText={setSupplier}
              placeholder="Nom du fournisseur"
            />
            <Input
              label="N° de lot"
              value={batchNumber}
              onChangeText={setBatchNumber}
              placeholder="LOT-001"
            />
            <Input
              label="Date de peremption"
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="2027-01-01"
            />
            <Input
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Remarques..."
              multiline
            />
          </View>

          <Pressable
            style={[styles.submitButton, saving && styles.disabledButton]}
            onPress={createPurchase}
            disabled={saving}
          >
            <Text style={styles.submitButtonText}>
              {saving ? "Enregistrement..." : "Enregistrer l'achat"}
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
    borderRadius: 12,
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
  hint: {
    color: "#5C7468",
    fontSize: 12,
    fontWeight: "700",
    fontStyle: "italic",
  },
  submitButton: {
    minHeight: 50,
    borderRadius: 10,
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
