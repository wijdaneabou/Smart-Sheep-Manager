import { useCallback, useState } from "react";
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
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { getUserById, updateUser } from "../../../../services/userService";

// TODO : remplacer par un select alimente par GET /roles (US-1.3) et
// GET /exploitations (Module 2) une fois ces endpoints disponibles.
const ROLES_HINT =
  "Roles : 1=Admin, 2=Manager, 3=Eleveur, 4=Ouvrier, 5=Veterinaire, 6=Cooperative";

export default function EditUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");
  const [exploitationId, setExploitationId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoadingUser(true);
      getUserById(userId).then((result) => {
        if (!active) return;
        if (result.success) {
          setFirstName(result.user.firstName);
          setLastName(result.user.lastName);
          setEmail(result.user.email);
          setPhone(result.user.phone ?? "");
          setRoleId(String(result.user.roleId));
          setExploitationId(
            result.user.exploitationId ? String(result.user.exploitationId) : ""
          );
        } else {
          setError(result.message);
        }
        setLoadingUser(false);
      });
      return () => {
        active = false;
      };
    }, [userId])
  );

  function validate(): string | null {
    if (firstName.trim().length < 2) return "Le prenom doit faire au moins 2 caracteres.";
    if (lastName.trim().length < 2) return "Le nom doit faire au moins 2 caracteres.";
    if (!email.includes("@")) return "Email invalide.";
    if (roleId && Number.isNaN(Number(roleId))) return "Le role doit etre un nombre.";
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

    setSaving(true);
    setError(null);

    const result = await updateUser(userId, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      roleId: roleId ? Number(roleId) : undefined,
      exploitationId: exploitationId ? Number(exploitationId) : undefined,
    });

    setSaving(false);

    if (result.success) {
      router.back();
    } else {
      setError(result.message);
    }
  }

  if (loadingUser) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Modifier le profil</Text>

        <TextInput
          style={styles.input}
          placeholder="Prenom"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Telephone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="ID du role"
          keyboardType="number-pad"
          value={roleId}
          onChangeText={setRoleId}
        />
        <Text style={styles.hint}>{ROLES_HINT}</Text>

        <TextInput
          style={styles.input}
          placeholder="ID de l'exploitation (optionnel)"
          keyboardType="number-pad"
          value={exploitationId}
          onChangeText={setExploitationId}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={handleSubmit} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enregistrer</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f5f5f5", flexGrow: 1 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  hint: { fontSize: 11, color: "#888", marginBottom: 14, marginTop: -4 },
  error: { color: "#dc2626", marginBottom: 12, fontSize: 13 },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});