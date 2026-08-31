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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createListing, type ListingStatus } from "../../../../services/marketplaceService";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";
const BORDER = "#ECECE6";

const LISTING_STATUSES: { value: ListingStatus; label: string }[] = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "PUBLISHED", label: "Publié" },
  { value: "SOLD", label: "Vendu" },
  { value: "ARCHIVED", label: "Archivé" },
];

export default function CreateListingScreen() {
  const router = useRouter();

  const [sellerId, setSellerId] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("MAD");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<ListingStatus>("DRAFT");
  const [photos, setPhotos] = useState("");
  const [specifications, setSpecifications] = useState("");

  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!sellerId || Number.isNaN(Number(sellerId))) return "Le vendeur est requis.";
    if (!sellerName.trim()) return "Le nom du vendeur est requis.";
    if (!title.trim()) return "Le titre est requis.";
    if (!price.trim()) return "Le prix est requis.";
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

    const result = await createListing({
      sellerId: Number(sellerId),
      sellerName: sellerName.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      price: price.trim(),
      currency,
      location: location.trim() || undefined,
      status,
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
          <Text style={styles.headerTitle}>Nouvelle annonce</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <SectionHeader icon="person-outline" label="Vendeur" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ID Vendeur</Text>
              <TextInput
                style={styles.input}
                placeholder="ID utilisateur"
                placeholderTextColor="#B0B0B0"
                value={sellerId}
                onChangeText={setSellerId}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom du vendeur</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor="#B0B0B0"
                value={sellerName}
                onChangeText={setSellerName}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="document-outline" label="Annonce" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Titre</Text>
              <TextInput
                style={styles.input}
                placeholder="Titre de l'annonce"
                placeholderTextColor="#B0B0B0"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description de l'animal..."
                placeholderTextColor="#B0B0B0"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Prix</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : 5000"
                placeholderTextColor="#B0B0B0"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Devise</Text>
              <TextInput
                style={styles.input}
                placeholder="MAD"
                placeholderTextColor="#B0B0B0"
                value={currency}
                onChangeText={setCurrency}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Localisation</Text>
              <TextInput
                style={styles.input}
                placeholder="Ville / région"
                placeholderTextColor="#B0B0B0"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Statut</Text>
              <Pressable
                style={styles.pickerTrigger}
                onPress={() => setShowStatusPicker(!showStatusPicker)}
              >
                <Text style={styles.pickerText}>
                  {LISTING_STATUSES.find((s) => s.value === status)?.label}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#666" />
              </Pressable>
              {showStatusPicker && (
                <View style={styles.pickerOptions}>
                  {LISTING_STATUSES.map((s) => (
                    <Pressable
                      key={s.value}
                      style={[styles.pickerOption, status === s.value && styles.pickerOptionActive]}
                      onPress={() => {
                        setStatus(s.value);
                        setShowStatusPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, status === s.value && styles.pickerOptionTextActive]}>
                        {s.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="image-outline" label="Photos & Fiche technique" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Photos (URLs séparées par des virgules)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="https://..."
                placeholderTextColor="#B0B0B0"
                value={photos}
                onChangeText={setPhotos}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Spécifications</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Race, âge, poids, etc."
                placeholderTextColor="#B0B0B0"
                value={specifications}
                onChangeText={setSpecifications}
                multiline
                numberOfLines={4}
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
                <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Publier l'annonce</Text>
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
    maxHeight: 200,
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
