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
import { createUser } from "../../../services/userService";
import RolePicker from "../../../components/RolePicker";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";
const BORDER = "#ECECE6";

export default function CreateUserScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number | null>(null);
  const [exploitationId, setExploitationId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (firstName.trim().length < 2) return "Le prénom doit faire au moins 2 caractères.";
    if (lastName.trim().length < 2) return "Le nom doit faire au moins 2 caractères.";
    if (!email.includes("@")) return "Email invalide.";
    if (password.length < 8) return "Le mot de passe doit faire au moins 8 caractères.";
    if (!roleId) return "Le rôle est requis.";
    if (exploitationId && Number.isNaN(Number(exploitationId)))
      return "L'exploitation doit être un nombre.";
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

    const result = await createUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      password,
      roleId: roleId!,
      exploitationId: exploitationId ? Number(exploitationId) : undefined,
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
          <Text style={styles.headerTitle}>Nouvel utilisateur</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Informations personnelles */}
          <View style={styles.section}>
            <SectionHeader icon="person-outline" label="Informations personnelles" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Ahmed"
                placeholderTextColor="#B0B0B0"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Bennani"
                placeholderTextColor="#B0B0B0"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="exemple@ssm.ma"
                placeholderTextColor="#B0B0B0"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="Optionnel"
                placeholderTextColor="#B0B0B0"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Sécurité */}
          <View style={styles.section}>
            <SectionHeader icon="lock-closed-outline" label="Sécurité" />
            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Min. 8 caractères"
                placeholderTextColor="#B0B0B0"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Affectation */}
          <View style={styles.section}>
            <SectionHeader icon="business-outline" label="Affectation" />

            <View style={styles.fieldGroup}>
              <RolePicker value={roleId} onChange={(id) => setRoleId(id)} />
            </View>

            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Exploitation (ID)</Text>
              <TextInput
                style={styles.input}
                placeholder="Optionnel"
                placeholderTextColor="#B0B0B0"
                keyboardType="number-pad"
                value={exploitationId}
                onChangeText={setExploitationId}
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
                <Text style={styles.buttonText}>Créer l'utilisateur</Text>
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