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
import { createOffer } from "@/services/loyaltyService";

export default function CreateOfferScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"VOLUME_DISCOUNT" | "TARGETED_OFFER">("VOLUME_DISCOUNT");
  const [minQuantity, setMinQuantity] = useState("1");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim()) { setError("Le titre est requis."); return; }
    if (!validFrom || !validTo) { setError("Les dates de validité sont requises."); return; }
    setLoading(true);
    setError(null);
    const res = await createOffer({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      minQuantity: Number(minQuantity) || 1,
      discountPercentage: discountPercentage ? Number(discountPercentage) : undefined,
      discountAmount: discountAmount ? Number(discountAmount) : undefined,
      validFrom: new Date(validFrom).toISOString(),
      validTo: new Date(validTo).toISOString(),
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
          <Text style={styles.headerTitle}>Nouvelle offre</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Titre</Text>
              <TextInput style={styles.input} placeholder="Ex : -10% sur 20 agneaux" value={title} onChangeText={setTitle} placeholderTextColor="#B0B0B0" />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Détails de l'offre..." value={description} onChangeText={setDescription} placeholderTextColor="#B0B0B0" multiline numberOfLines={3} />
            </View>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Type</Text>
                <Pressable style={styles.pickerTrigger} onPress={() => setType(type === "VOLUME_DISCOUNT" ? "TARGETED_OFFER" : "VOLUME_DISCOUNT")}>
                  <Text style={styles.pickerText}>{type === "VOLUME_DISCOUNT" ? "Remise volume" : "Offre ciblée"}</Text>
                  <Ionicons name="chevron-down-outline" size={18} color="#666" />
                </Pressable>
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Qté min</Text>
                <TextInput style={styles.input} placeholder="1" value={minQuantity} onChangeText={setMinQuantity} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Remise %</Text>
                <TextInput style={styles.input} placeholder="Ex : 10" value={discountPercentage} onChangeText={setDiscountPercentage} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Remise MAD</Text>
                <TextInput style={styles.input} placeholder="Ex : 50" value={discountAmount} onChangeText={setDiscountAmount} keyboardType="numeric" placeholderTextColor="#B0B0B0" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date début</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={validFrom} onChangeText={setValidFrom} placeholderTextColor="#B0B0B0" />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date fin</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={validTo} onChangeText={setValidTo} placeholderTextColor="#B0B0B0" />
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
                <Ionicons name="pricetag-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Créer l'offre</Text>
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
  pickerTrigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#ECECE6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  pickerText: { fontSize: 15, color: "#1f2937" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  errorText: { color: "#dc2626", fontSize: 13, flex: 1 },
  button: { flexDirection: "row", backgroundColor: "#15803D", borderRadius: 12, paddingVertical: 15, alignItems: "center", justifyContent: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
