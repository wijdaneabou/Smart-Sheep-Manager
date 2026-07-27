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
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../../../../services/api";
import {
  getAnimalById,
  updateAnimal,
  type Animal,
  type Breed,
  type Sex,
  type HealthStatus,
} from "../../../../services/animalsService";
import { BREEDS, SEXES, HEALTH_STATUSES } from "../../../../constants/breeds";

export default function EditAnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animalId = Number(id);
  const router = useRouter();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Identité ---
  const [rfid, setRfid] = useState("");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState<Breed>("Sardi");
  const [sex, setSex] = useState<Sex>("FEMALE");
  const [exploitationId, setExploitationId] = useState("");

  // --- Caractéristiques ---
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [bcs, setBcs] = useState("");
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("HEALTHY");

  // --- Pedigree ---
  const [fatherId, setFatherId] = useState("");
  const [motherId, setMotherId] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoadingData(true);
      getAnimalById(animalId).then((result) => {
        if (!active) return;
        if (result.success) {
          const a = result.animal;
          setAnimal(a);
          setRfid(a.rfid);
          setName(a.name);
          setBreed(a.breed);
          setSex(a.sex);
          setBirthDate(
            a.birthDate ? a.birthDate.split("T")[0] : ""
            );
          setWeight(a.weight ?? "");
          setBcs(a.bcs ?? "");
          setHealthStatus(a.healthStatus);
          setFatherId(a.fatherId ? String(a.fatherId) : "");
          setMotherId(a.motherId ? String(a.motherId) : "");
          setExploitationId(a.exploitationId ? String(a.exploitationId) : "");
          if (a.photoUrl) {
            setPhotoUri(a.photoUrl);
          }
        } else {
          setError(result.message);
        }
        setLoadingData(false);
      });
      return () => {
        active = false;
      };
    }, [animalId])
  );

  function validate(): string | null {
    if (rfid.trim().length < 1) return "Le RFID est requis.";
    if (name.trim().length < 1) return "Le nom est requis.";
    if (weight && Number.isNaN(Number(weight))) return "Le poids doit être un nombre.";
    if (bcs && Number.isNaN(Number(bcs))) return "Le BCS doit être un nombre.";
    if (fatherId && Number.isNaN(Number(fatherId))) return "L'ID du père doit être un nombre.";
    if (motherId && Number.isNaN(Number(motherId))) return "L'ID de la mère doit être un nombre.";
    if (exploitationId && Number.isNaN(Number(exploitationId))) return "L'exploitation doit être un nombre.";
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

    const result = await updateAnimal(animalId, {
      rfid: rfid.trim(),
      name: name.trim(),
      breed,
      sex,
      birthDate: birthDate || null,
      weight: weight ? Number(weight) : null,
      bcs: bcs ? Number(bcs) : null,
      healthStatus,

      
      fatherId: fatherId ? Number(fatherId) : null,
      motherId: motherId ? Number(motherId) : null,
      exploitationId: exploitationId ? Number(exploitationId) : null,
      photoUri: photoUri ?? undefined,
    });

    setSaving(false);

    if (result.success) {
      router.back();
    } else {
      setError(result.message);
    }
  }
  async function pickImage() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission refusée");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }
  if (loadingData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
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
          <Text style={styles.headerTitle}>Modifier la fiche</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <SectionTitle index={0} label="Photo" />
          <View
            style={{
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            {photoUri ? (
              <Image
                source={{
                  uri: photoUri.startsWith("http")
                    ? photoUri
                    : `${API_URL}${photoUri}`,
                }}
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 75,
                }}
              />
            ) : (
              <View
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 75,
                  backgroundColor: "#ddd",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text>Aucune photo</Text>
              </View>
            )}

            <Pressable
              onPress={pickImage}
              style={{
                marginTop: 15,
                backgroundColor: "#14532d",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#fff" }}>
                Changer la photo
              </Text>
            </Pressable>
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
              {BREEDS.map((b) => {
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
              {SEXES.map((s) => {
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

           {/* --- Exploitation --- */}
           <View style={styles.fieldGroup}>
             <Text style={styles.label}>Exploitation (ID)</Text>
             <TextInput
               style={styles.input}
               placeholder="Optionnel"
               placeholderTextColor="#aaa"
               keyboardType="numeric"
               value={exploitationId}
               onChangeText={setExploitationId}
             />
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
              {HEALTH_STATUSES.map((h) => {
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

          <Pressable style={styles.button} onPress={handleSubmit} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="save" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>ENREGISTRER</Text>
              </>
            )}
          </Pressable>
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
  container: { padding: 20, paddingTop: 4, flexGrow: 1 },

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

  button: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
