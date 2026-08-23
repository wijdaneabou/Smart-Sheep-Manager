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
import { createNotification } from "@/services/loyaltyService";

export default function CreateNotificationScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"AVAILABILITY" | "PRICE_DROP" | "NEW_ARRIVAL">("AVAILABILITY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim()) { setError("Le titre est requis."); return; }
    if (!message.trim()) { setError("Le message est requis."); return; }
    setLoading(true);
    setError(null);
    const res = await createNotification({ title: title.trim(), message: message.trim(), type });
    setLoading(false);
    if (res.success) {
      router.back();
    } else {
      setError(res.message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#15803D" />
          </Pressable>
          <Text style={styles.headerTitle}>Nouvelle notification</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Titre</Text>
              <TextInput style={styles.input} placeholder="Ex : Nouvelle disponibilité en agneaux" value={title} onChangeText={setTitle} placeholderTextColor="#B0B0B0" />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Détails du message..." value={message} onChangeText={setMessage} placeholderTextColor="#B0B0B0" multiline numberOfLines={4} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Type</Text>
              <Pressable style={styles.pickerTrigger} onPress={() => setType(type === "AVAILABILITY" ? "PRICE_DROP" : type === "PRICE_DROP" ? "NEW_ARRIVAL" : "AVAILABILITY")}>
                <Text style={styles.pickerText}>{type === "AVAILABILITY" ? "Disponibilité" : type === "PRICE_DROP" ? "Baisse de prix" : "Nouveauté"}</Text>
                <Ionicons name="chevron-down-outline" size={18} color="#666" />
              </Pressable>
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Envoyer la notification</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2FAF5" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#0F2A1D" },
  container: { padding: 16, paddingTop: 4, paddingBottom: 40, flexGrow: 1 },
  section: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#ECECE6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#1f2937" },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  pickerTrigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#ECECE6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  pickerText: { fontSize: 15, color: "#1f2937" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  errorText: { color: "#dc2626", fontSize: 13, flex: 1 },
  button: { flexDirection: "row", backgroundColor: "#15803D", borderRadius: 12, paddingVertical: 15, alignItems: "center", justifyContent: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
