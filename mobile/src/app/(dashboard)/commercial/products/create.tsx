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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createProduct, type ProductCategory, type ProductAvailability } from "../../../../services/productsService";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";
const BORDER = "#ECECE6";

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "AGNEAUX", label: "Agneaux" },
  { value: "MOUTONS", label: "Moutons" },
  { value: "LAINE", label: "Laine" },
  { value: "VIANDE", label: "Viande" },
  { value: "AUTRE", label: "Autre" },
];

const AVAILABILITIES: { value: ProductAvailability; label: string }[] = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "LIMITE", label: "Limité" },
  { value: "RUPTURE", label: "Rupture" },
];

export default function CreateProductScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("AGNEAUX");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [availability, setAvailability] = useState<ProductAvailability>("DISPONIBLE");
  const [photos, setPhotos] = useState("");
  const [specifications, setSpecifications] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);

  function validate(): string | null {
    if (name.trim().length < 2) return "Le nom doit faire au moins 2 caractères.";
    if (description.trim().length < 5) return "La description doit faire au moins 5 caractères.";
    if (!price || Number.isNaN(Number(price)) || Number(price) <= 0) return "Le prix doit être un nombre positif.";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createProduct({
      name: name.trim(),
      category,
      description: description.trim(),
      price: Number(price),
      availability,
      photos: photos.trim() || undefined,
      specifications: specifications.trim() || undefined,
    });

    setLoading(false);

    if (result.success) {
      router.back();
    } else {
      setError(result.message);
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
          <Text style={styles.headerTitle}>Nouveau produit</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <SectionHeader icon="cube-outline" label="Informations générales" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom du produit</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Agneau de lait"
                placeholderTextColor="#B0B0B0"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Catégorie</Text>
              <Pressable
                style={styles.pickerTrigger}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={styles.pickerText}>
                  {CATEGORIES.find((c) => c.value === category)?.label}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#666" />
              </Pressable>
              {showCategoryPicker && (
                <View style={styles.pickerOptions}>
                  {CATEGORIES.map((c) => (
                    <Pressable
                      key={c.value}
                      style={[styles.pickerOption, category === c.value && styles.pickerOptionActive]}
                      onPress={() => {
                        setCategory(c.value);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, category === c.value && styles.pickerOptionTextActive]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez le produit..."
                placeholderTextColor="#B0B0B0"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Prix indicatif (MAD)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : 120"
                placeholderTextColor="#B0B0B0"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Disponibilité</Text>
              <Pressable
                style={styles.pickerTrigger}
                onPress={() => setShowAvailabilityPicker(!showAvailabilityPicker)}
              >
                <Text style={styles.pickerText}>
                  {AVAILABILITIES.find((a) => a.value === availability)?.label}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#666" />
              </Pressable>
              {showAvailabilityPicker && (
                <View style={styles.pickerOptions}>
                  {AVAILABILITIES.map((a) => (
                    <Pressable
                      key={a.value}
                      style={[styles.pickerOption, availability === a.value && styles.pickerOptionActive]}
                      onPress={() => {
                        setAvailability(a.value);
                        setShowAvailabilityPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, availability === a.value && styles.pickerOptionTextActive]}>
                        {a.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="image-outline" label="Médias & Fiche technique" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Photos (URLs séparées par des virgules)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="https://.../photo1.jpg, https://.../photo2.jpg"
                placeholderTextColor="#B0B0B0"
                value={photos}
                onChangeText={setPhotos}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Fiche technique</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Caractéristiques techniques, poids, race, etc."
                placeholderTextColor="#B0B0B0"
                value={specifications}
                onChangeText={setSpecifications}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cube-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Créer le produit</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={GREEN} />
      <Text style={styles.sectionHeaderText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CREAM },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN },

  container: { padding: 16, paddingTop: 4, paddingBottom: 40, flexGrow: 1 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerText: { fontSize: 15, color: "#1f2937" },
  pickerOptions: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerOptionActive: { backgroundColor: "#DCFCE7" },
  pickerOptionText: { fontSize: 15, color: "#333" },
  pickerOptionTextActive: { color: GREEN, fontWeight: "700" },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: { color: "#dc2626", fontSize: 13, flex: 1 },

  button: {
    flexDirection: "row",
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
