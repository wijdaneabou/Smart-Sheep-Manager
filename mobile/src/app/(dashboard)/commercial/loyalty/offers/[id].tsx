import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getOfferById, updateOffer } from "@/services/loyaltyService";

export default function OfferDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minQuantity, setMinQuantity] = useState("1");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getOfferById(Number(id));
      if (res.success) {
        const o = res.offer;
        setTitle(o.title);
        setDescription(o.description || "");
        setMinQuantity(String(o.minQuantity));
        setDiscountPercentage(o.discountPercentage || "");
        setDiscountAmount(o.discountAmount || "");
        setValidFrom(o.validFrom.slice(0, 10));
        setValidTo(o.validTo.slice(0, 10));
        setIsActive(o.isActive);
      } else {
        setError(res.message);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave() {
    if (!title.trim()) { setError("Le titre est requis."); return; }
    setSaving(true);
    setError(null);
    const res = await updateOffer(Number(id), {
      title: title.trim(),
      description: description.trim() || undefined,
      minQuantity: Number(minQuantity) || 1,
      discountPercentage: discountPercentage ? String(Number(discountPercentage)) : undefined,
      discountAmount: discountAmount ? String(Number(discountAmount)) : undefined,
      validFrom: new Date(validFrom).toISOString(),
      validTo: new Date(validTo).toISOString(),
      isActive,
    });
    setSaving(false);
    if (res.success) {
      router.back();
    } else {
      setError(res.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#15803D" />
          </Pressable>
          <Text style={styles.headerTitle}>Modifier l'offre</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Titre</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor="#B0B0B0" />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholderTextColor="#B0B0B0" multiline numberOfLines={3} />
            </View>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Qté min</Text>
                <TextInput style={styles.input} value={minQuantity} onChangeText={setMinQuantity} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Remise %</Text>
                <TextInput style={styles.input} value={discountPercentage} onChangeText={setDiscountPercentage} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date début</Text>
                <TextInput style={styles.input} value={validFrom} onChangeText={setValidFrom} placeholderTextColor="#B0B0B0" />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date fin</Text>
                <TextInput style={styles.input} value={validTo} onChangeText={setValidTo} placeholderTextColor="#B0B0B0" />
              </View>
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enregistrer</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2FAF5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  errorText: { color: "#dc2626", fontSize: 13, flex: 1 },
  button: { flexDirection: "row", backgroundColor: "#15803D", borderRadius: 12, paddingVertical: 15, alignItems: "center", justifyContent: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
