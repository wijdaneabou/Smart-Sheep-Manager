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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getUserById, updateUser } from "../../../../services/userService";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";

// TODO : remplacer par un select alimenté par GET /roles (US-1.3) une fois disponible.
const ROLES: { id: number; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 1, label: "Admin", icon: "shield-checkmark-outline" },
  { id: 2, label: "Manager", icon: "briefcase-outline" },
  { id: 3, label: "Éleveur", icon: "leaf-outline" },
  { id: 4, label: "Ouvrier", icon: "hammer-outline" },
  { id: 5, label: "Vétérinaire", icon: "medkit-outline" },
  { id: 6, label: "Coopérative", icon: "people-outline" },
];

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
    if (firstName.trim().length < 2) return "Le prénom doit faire au moins 2 caractères.";
    if (lastName.trim().length < 2) return "Le nom doit faire au moins 2 caractères.";
    if (!email.includes("@")) return "Email invalide.";
    if (roleId && Number.isNaN(Number(roleId))) return "Le rôle doit être valide.";
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
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={GREEN} />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Identité */}
          <View style={styles.section}>
            <SectionHeader icon="person-outline" label="Identité" />

            <FormField
              icon="person-outline"
              label="Prénom"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="ex : Ahmed"
            />
            <FormField
              icon="person-outline"
              label="Nom"
              value={lastName}
              onChangeText={setLastName}
              placeholder="ex : Benali"
            />
            <FormField
              icon="mail-outline"
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="nom@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormField
              icon="call-outline"
              label="Téléphone"
              value={phone}
              onChangeText={setPhone}
              placeholder="06 12 34 56 78"
              keyboardType="phone-pad"
              isLast
            />
          </View>

          {/* Rôle */}
          <View style={styles.section}>
            <SectionHeader icon="shield-checkmark-outline" label="Rôle" />
            <View style={styles.roleGrid}>
              {ROLES.map((role) => {
                const selected = roleId === String(role.id);
                return (
                  <Pressable
                    key={role.id}
                    style={[styles.roleChip, selected && styles.roleChipSelected]}
                    onPress={() => setRoleId(String(role.id))}
                  >
                    <Ionicons
                      name={role.icon}
                      size={15}
                      color={selected ? "#fff" : GREEN}
                    />
                    <Text style={[styles.roleChipText, selected && styles.roleChipTextSelected]}>
                      {role.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Affectation */}
          <View style={styles.section}>
            <SectionHeader icon="business-outline" label="Affectation" />
            <FormField
              icon="business-outline"
              label="Exploitation"
              value={exploitationId}
              onChangeText={setExploitationId}
              placeholder="ID de l'exploitation (optionnel)"
              keyboardType="number-pad"
              isLast
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>ENREGISTRER</Text>
              </>
            )}
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={saving}>
            <Text style={styles.cancelButtonText}>ANNULER</Text>
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

function FormField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences";
  isLast?: boolean;
}) {
  return (
    <View style={[styles.fieldWrapper, !isLast && styles.fieldWrapperSpaced]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputRow}>
        <Ionicons name={icon} size={16} color="#999" style={styles.fieldIcon} />
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B0B0B0"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  container: { padding: 16, paddingBottom: 40 },

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

  fieldWrapper: {},
  fieldWrapperSpaced: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#666", marginBottom: 6 },
  fieldInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#ECECE6",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  fieldIcon: { marginRight: 8 },
  fieldInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
  },

  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#ECECE6",
  },
  roleChipSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  roleChipText: { fontSize: 13, fontWeight: "600", color: "#1f2937" },
  roleChipTextSelected: { color: "#fff" },

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

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 10,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  cancelButtonText: { color: "#666", fontWeight: "600", fontSize: 13 },
});