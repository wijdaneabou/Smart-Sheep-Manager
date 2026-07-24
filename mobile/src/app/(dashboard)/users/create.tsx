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
import { createUser } from "../../../services/userService";
import RolePicker from "../../../components/RolePicker";

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
    if (firstName.trim().length < 2) return "Le prenom doit faire au moins 2 caracteres.";
    if (lastName.trim().length < 2) return "Le nom doit faire au moins 2 caracteres.";
    if (!email.includes("@")) return "Email invalide.";
    if (password.length < 8) return "Le mot de passe doit faire au moins 8 caracteres.";
    if (!roleId) return "Le role est requis.";
    if (exploitationId && Number.isNaN(Number(exploitationId)))
      return "L'exploitation doit etre un nombre.";
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
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Nouvel utilisateur</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prenom</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Ahmed"
              placeholderTextColor="#A6C8B2"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Bennani"
              placeholderTextColor="#A6C8B2"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@ssm.ma"
              placeholderTextColor="#A6C8B2"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Telephone</Text>
            <TextInput
              style={styles.input}
              placeholder="Optionnel"
              placeholderTextColor="#A6C8B2"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Text style={styles.sectionTitle}>Securite</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Min. 8 caracteres"
              placeholderTextColor="#A6C8B2"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Text style={styles.sectionTitle}>Affectation</Text>
          <View style={styles.fieldGroup}>
            <RolePicker
              value={roleId}
              onChange={(id) => setRoleId(id)}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Exploitation (ID)</Text>
            <TextInput
              style={styles.input}
              placeholder="Optionnel"
              placeholderTextColor="#A6C8B2"
              keyboardType="number-pad"
              value={exploitationId}
              onChangeText={setExploitationId}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Creer l'utilisateur</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2FAF5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { fontSize: 26, color: "#0F2A1D", fontWeight: "400" },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  container: { padding: 20, paddingTop: 4, flexGrow: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7EAB91",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 10,
  },
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#2F6B46", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  hint: { fontSize: 11, color: "#A6C8B2", marginTop: 6 },
  error: {
    color: "#166534",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
  },
  button: {
    backgroundColor: "#0b812d",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});