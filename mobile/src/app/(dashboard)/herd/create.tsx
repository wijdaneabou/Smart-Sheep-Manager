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
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  createAnimal,
  type Breed,
  type Sex,
  type HealthStatus,
} from "../../../services/animalsService";
import { BREEDS, SEXES, HEALTH_STATUSES } from "../../../constants/breeds";

export default function CreateAnimalScreen() {
  const router = useRouter();

  // --- Photo ---
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // --- Identité ---
  const [rfid, setRfid] = useState("MA202600001245");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState<Breed>("Sardi");
  const [sex, setSex] = useState<Sex>("FEMALE");

  // --- Caractéristiques ---
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [bcs, setBcs] = useState("");
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("HEALTHY");

  // --- Pedigree ---
  const [fatherId, setFatherId] = useState("");
  const [motherId, setMotherId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission requise",
        "Autorisez l'accès à vos photos pour choisir une image."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission requise",
        "Autorisez l'accès à la caméra pour prendre une photo."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function onPickPhoto() {
    Alert.alert("Photo de l'animal", "Choisissez une source", [
      { text: "Prendre une photo", onPress: takePhoto },
      { text: "Choisir dans la galerie", onPress: pickFromLibrary },
      ...(photoUri
        ? [{ text: "Supprimer la photo", style: "destructive" as const, onPress: () => setPhotoUri(null) }]
        : []),
      { text: "Annuler", style: "cancel" as const },
    ]);
  }

  function validate(): string | null {
    if (rfid.trim().length < 1) return "Le RFID est requis.";
    if (name.trim().length < 1) return "Le nom est requis.";
    if (weight && Number.isNaN(Number(weight))) return "Le poids doit être un nombre.";
    if (bcs && Number.isNaN(Number(bcs))) return "Le BCS doit être un nombre.";
    if (fatherId && Number.isNaN(Number(fatherId))) return "L'ID du père doit être un nombre.";
    if (motherId && Number.isNaN(Number(motherId))) return "L'ID de la mère doit être un nombre.";
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

    const result = await createAnimal({
      rfid: rfid.trim(),
      name: name.trim(),
      breed,
      sex,
      birthDate: birthDate || undefined,
      weight: weight ? Number(weight) : undefined,
      bcs: bcs ? Number(bcs) : undefined,
      healthStatus,
      fatherId: fatherId ? Number(fatherId) : undefined,
      motherId: motherId ? Number(motherId) : undefined,
      // NOTE: `photoUri` is a local file URI for now. If your backend accepts
      // photo uploads, replace this with the uploaded file's URL, or switch
      // this call to a multipart/form-data request that includes the file.
      // You'll also need to add `photoUrl`/`photoUri` to the `createAnimal`
      // payload type in animalsService.ts.
      ...(photoUri ? { photoUri } : {}),
    } as any);

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
            <Ionicons name="arrow-back" size={22} color="#14532d" />
          </Pressable>
          <Text style={styles.headerTitle}>Nouvel Animal</Text>
          <View style={styles.avatar}>
            <Ionicons name="paw" size={16} color="#fff" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- Photo --- */}
          <View style={styles.photoSection}>
            <Pressable onPress={onPickPhoto} style={styles.photoCircle}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
              ) : (
                <Ionicons name="camera-outline" size={28} color="#9ca3af" />
              )}
              <View style={styles.photoBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.photoHint}>
              {photoUri ? "Modifier la photo" : "Ajouter une photo"}
            </Text>
          </View>

          {/* --- 1. Identité --- */}
          <SectionTitle index={1} label="Identité" />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>RFID</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : MA202600001245"
              placeholderTextColor="#aaa"
              value={rfid}
              onChangeText={setRfid}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Bérberis"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Race</Text>
            <View style={styles.typeRow}>
              {BREEDS.map((b: { id: Breed; label: string; icon: string }) => {
                const selected = breed === b.id;
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => setBreed(b.id)}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                  >
                    <Text style={[styles.typeChipIcon, selected && { color: "#fff" }]}>
                      {b.icon}
                    </Text>
                    <Text style={[styles.typeChipLabel, selected && { color: "#fff" }]}>
                      {b.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Sexe</Text>
            <View style={styles.typeRow}>
              {SEXES.map((s: { id: Sex; label: string; icon: string }) => {
                const selected = sex === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSex(s.id)}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                  >
                    <Text style={[styles.typeChipIcon, selected && { color: "#fff" }]}>
                      {s.icon}
                    </Text>
                    <Text style={[styles.typeChipLabel, selected && { color: "#fff" }]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* --- 2. Caractéristiques --- */}
          <SectionTitle index={2} label="Caractéristiques" />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Date de naissance</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#aaa"
              value={birthDate}
              onChangeText={setBirthDate}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.label}>Poids (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#aaa"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.label}>BCS</Text>
              <TextInput
                style={styles.input}
                placeholder="1.0 - 5.0"
                placeholderTextColor="#aaa"
                keyboardType="decimal-pad"
                value={bcs}
                onChangeText={setBcs}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Statut santé</Text>
            <View style={styles.typeRow}>
              {HEALTH_STATUSES.map((h: { id: HealthStatus; label: string; icon: string; color: string }) => {
                const selected = healthStatus === h.id;
                return (
                  <Pressable
                    key={h.id}
                    onPress={() => setHealthStatus(h.id)}
                    style={[
                      styles.typeChip,
                      selected && { backgroundColor: h.color, borderColor: h.color },
                    ]}
                  >
                    <Text style={[styles.typeChipIcon, selected && { color: "#fff" }]}>
                      {h.icon}
                    </Text>
                    <Text style={[styles.typeChipLabel, selected && { color: "#fff" }]}>
                      {h.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* --- 3. Pedigree --- */}
          <SectionTitle index={3} label="Pedigree" />

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.label}>Père (ID)</Text>
              <TextInput
                style={styles.input}
                placeholder="Optionnel"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={fatherId}
                onChangeText={setFatherId}
              />
            </View>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.label}>Mère (ID)</Text>
              <TextInput
                style={styles.input}
                placeholder="Optionnel"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={motherId}
                onChangeText={setMotherId}
              />
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actionsRow}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>ANNULER</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="save" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>ENREGISTRER</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionTitle({ index, label }: { index: number; label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>
        {index}. {label}
      </Text>
    </View>
  );
}

const GREEN = "#14532d";
const BORDER = "#e5e0d8";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#faf6f1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { padding: 20, paddingTop: 4, flexGrow: 1 },

  photoSection: { alignItems: "center", marginBottom: 8 },
  photoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoImage: { width: 96, height: 96, borderRadius: 48 },
  photoBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#faf6f1",
  },
  photoHint: { marginTop: 8, fontSize: 12, fontWeight: "600", color: GREEN },

  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 12 },
  sectionBar: { width: 4, height: 14, backgroundColor: GREEN, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937" },

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
  },

  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 14,
  },
  typeChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  typeChipIcon: { fontSize: 18, marginBottom: 4, color: "#555" },
  typeChipLabel: { fontSize: 12, fontWeight: "700", color: "#555" },

  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },

  error: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
  },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelButtonText: { color: "#444", fontWeight: "700", fontSize: 13 },
  button: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 12, textAlign: "center" },
});
