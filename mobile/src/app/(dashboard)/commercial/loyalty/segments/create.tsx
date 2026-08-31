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
import { createSegment } from "@/services/loyaltyService";

export default function CreateSegmentScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [maxScore, setMaxScore] = useState("100");
  const [minFrequency, setMinFrequency] = useState("0");
  const [maxFrequency, setMaxFrequency] = useState("");
  const [minBasket, setMinBasket] = useState("0");
  const [maxBasket, setMaxBasket] = useState("");
  const [color, setColor] = useState("#15803D");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Le nom du segment est requis.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await createSegment({
      name: name.trim(),
      description: description.trim() || undefined,
      minScore: Number(minScore) || 0,
      maxScore: Number(maxScore) || 100,
      minFrequency: Number(minFrequency) || 0,
      maxFrequency: maxFrequency ? Number(maxFrequency) : null,
      minBasket: String(Number(minBasket) || 0),
      maxBasket: maxBasket ? String(Number(maxBasket)) : null,
      color,
    });
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
          <Text style={styles.headerTitle}>Nouveau segment</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom</Text>
              <TextInput style={styles.input} placeholder="Ex : VIP, Régulier..." value={name} onChangeText={setName} placeholderTextColor="#B0B0B0" />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Description du segment..." value={description} onChangeText={setDescription} placeholderTextColor="#B0B0B0" multiline numberOfLines={3} />
            </View>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Score min</Text>
                <TextInput style={styles.input} placeholder="0" value={minScore} onChangeText={setMinScore} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Score max</Text>
                <TextInput style={styles.input} placeholder="100" value={maxScore} onChangeText={setMaxScore} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Fréq. min</Text>
                <TextInput style={styles.input} placeholder="0" value={minFrequency} onChangeText={setMinFrequency} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Fréq. max</Text>
                <TextInput style={styles.input} placeholder="Optionnel" value={maxFrequency} onChangeText={setMaxFrequency} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Panier min (MAD)</Text>
                <TextInput style={styles.input} placeholder="0" value={minBasket} onChangeText={setMinBasket} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Panier max (MAD)</Text>
                <TextInput style={styles.input} placeholder="Optionnel" value={maxBasket} onChangeText={setMaxBasket} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Couleur</Text>
              <View style={styles.colorRow}>
                {["#15803D", "#166534", "#2F855A", "#1F7A4D", "#D97706", "#DC2626", "#7C3AED", "#2563EB"].map((c) => (
                  <Pressable key={c} style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorOptionSelected]} onPress={() => setColor(c)} />
                ))}
              </View>
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
                <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Créer le segment</Text>
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
  row: { flexDirection: "row", gap: 12 },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorOption: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  colorOptionSelected: { borderColor: "#0F2A1D" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  errorText: { color: "#dc2626", fontSize: 13, flex: 1 },
  button: { flexDirection: "row", backgroundColor: "#15803D", borderRadius: 12, paddingVertical: 15, alignItems: "center", justifyContent: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
