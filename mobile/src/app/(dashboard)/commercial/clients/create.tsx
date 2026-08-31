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
import { createClient, type ClientType } from "../../../../services/clientsService";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";
const BORDER = "#ECECE6";

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: "ACHETEUR", label: "Acheteur" },
  { value: "BOUCHER", label: "Boucher" },
  { value: "GROSSISTE", label: "Grossiste" },
  { value: "COOPERATIVE", label: "Coopérative" },
];

export default function CreateClientScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [type, setType] = useState<ClientType>("ACHETEUR");
  const [preferences, setPreferences] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);

  function validate(): string | null {
    if (name.trim().length < 2) return "Le nom doit faire au moins 2 caractères.";
    if (contact.trim().length < 2) return "Le contact est requis.";
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

    const result = await createClient({
      name: name.trim(),
      contact: contact.trim(),
      type,
      preferences: preferences.trim() || undefined,
      notes: notes.trim() || undefined,
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
          <Text style={styles.headerTitle}>Nouveau client</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <SectionHeader icon="person-outline" label="Informations générales" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Boucherie Centrale"
                placeholderTextColor="#B0B0B0"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="Téléphone ou email"
                placeholderTextColor="#B0B0B0"
                value={contact}
                onChangeText={setContact}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Type</Text>
              <Pressable
                style={styles.pickerTrigger}
                onPress={() => setShowTypePicker(!showTypePicker)}
              >
                <Text style={styles.pickerText}>
                  {CLIENT_TYPES.find((t) => t.value === type)?.label}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#666" />
              </Pressable>
              {showTypePicker && (
                <View style={styles.pickerOptions}>
                  {CLIENT_TYPES.map((t) => (
                    <Pressable
                      key={t.value}
                      style={[
                        styles.pickerOption,
                        type === t.value && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setType(t.value);
                        setShowTypePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          type === t.value && styles.pickerOptionTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="settings-outline" label="Préférences & Notes" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Préférences (race, poids, quantité...)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex : Préfère race Barbarine, poids 35-45kg, quantité 10-20 têtes"
                placeholderTextColor="#B0B0B0"
                value={preferences}
                onChangeText={setPreferences}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes diverses..."
                placeholderTextColor="#B0B0B0"
                value={notes}
                onChangeText={setNotes}
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
                <Ionicons name="person-add-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Créer le client</Text>
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
