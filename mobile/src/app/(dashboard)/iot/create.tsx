import { useEffect, useState } from "react";
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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Picker } from "@react-native-picker/picker";
import {
  createIotShield,
  type SensorType,
  type ShieldStatus,
} from "../../../services/iotShieldsService";
import {
  listAnimals,
  type Animal,
} from "../../../services/animalsService";
import { getExploitations } from "../../../services/exploitationservice"; // we'll create this
import { SENSOR_TYPES, SHIELD_STATUSES } from "../../../constants/iot";
import { useAuth } from "../../../hooks/useAuth";

export default function CreateIotShieldScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // --- Identité ---
  const [ssmIotNumber, setSsmIotNumber] = useState("SSM-IOT-000001");
  const [sensorType, setSensorType] = useState<SensorType>("LOCALIZATION");

  // --- Configuration ---
  const [battery, setBattery] = useState("100");
  const [status, setStatus] = useState<ShieldStatus>("ACTIVE");

  // --- Association ---
  const [exploitations, setExploitations] = useState<{ id: number; name: string }[]>([]);
  const [selectedExploitationId, setSelectedExploitationId] = useState<number | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingAnimals, setLoadingAnimals] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Clé API du bouclier créé ---
  const [createdShield, setCreatedShield] = useState<{
    ssmIotNumber: string;
    apiKey: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Load exploitations on mount ──
  useEffect(() => {
    loadExploitations();
  }, []);

  async function loadExploitations() {
    try {
      const data = await getExploitations();
      setExploitations(data);
      if (data.length === 1) {
        setSelectedExploitationId(data[0].id);
        loadAnimals(data[0].id);
      } else if (data.length > 1) {
        // Let user choose; don't auto-select
        setSelectedExploitationId(null);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les exploitations.");
    }
  }

  async function loadAnimals(exploitationId: number) {
    if (!exploitationId) return;
    setLoadingAnimals(true);
    const result = await listAnimals({
      page: 1,
      limit: 100,
      exploitationId, // ✅ filter by exploitation
    });
    setLoadingAnimals(false);
    if (result.success) {
      setAnimals(result.data);
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  // ── When exploitation selection changes, reload animals ──
  function handleExploitationChange(expId: number) {
    setSelectedExploitationId(expId);
    setSelectedAnimalId(null);
    loadAnimals(expId);
  }

  function validate(): string | null {
    if (!/^SSM-IOT-\d+$/.test(ssmIotNumber.trim()))
      return "Le numéro SSM-IOT doit être au format SSM-IOT-XXXXXX.";
    if (battery && Number.isNaN(Number(battery)))
      return "La batterie doit être un nombre.";
    if (Number(battery) < 0 || Number(battery) > 100)
      return "La batterie doit être entre 0 et 100.";
    if (!selectedExploitationId) {
      return "Veuillez sélectionner une exploitation.";
    }
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

    const result = await createIotShield({
      ssmIotNumber: ssmIotNumber.trim(),
      sensorType,
      battery: battery ? Number(battery) : undefined,
      animalId: selectedAnimalId,
      status,
      exploitationId: selectedExploitationId!, // ✅ pass selected
    });

    setLoading(false);

    if (result.success) {
      setCreatedShield({
        ssmIotNumber: result.shield.ssmIotNumber,
        apiKey: result.shield.apiKey,
      });
    } else {
      setError(result.message);
    }
  }

  async function handleCopyKey() {
    if (!createdShield) return;
    await Clipboard.setStringAsync(createdShield.apiKey);
    setCopied(true);
  }

  function handleCloseModal() {
    setCreatedShield(null);
    setCopied(false);
    router.back();
  }

  const getStatusStyle = (statusId: ShieldStatus) => {
    const statusObj = SHIELD_STATUSES.find((s) => s.id === statusId);
    return statusObj ? statusObj.color : GREEN;
  };

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
          <Text style={styles.headerTitle}>Nouveau Bouclier IoT</Text>
          <View style={styles.avatar}>
            <Ionicons name="wifi" size={16} color="#fff" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- 1. Identité --- */}
          <SectionTitle index={1} label="Identité" />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Numéro SSM-IOT</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : SSM-IOT-000123"
              placeholderTextColor="#aaa"
              value={ssmIotNumber}
              onChangeText={setSsmIotNumber}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Type de capteur</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={sensorType}
                onValueChange={(itemValue) => setSensorType(itemValue)}
                style={styles.picker}
                dropdownIconColor="#14532d"
              >
                {SENSOR_TYPES.map((type) => (
                  <Picker.Item
                    key={type.id}
                    label={`${type.icon} ${type.label}`}
                    value={type.id}
                  />
                ))}
              </Picker>
              <View style={styles.pickerIcon}>
                <Ionicons name="chevron-down" size={20} color="#14532d" />
              </View>
            </View>
          </View>

          {/* --- 2. Configuration --- */}
          <SectionTitle index={2} label="Configuration" />

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.label}>Batterie (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="0-100"
                placeholderTextColor="#aaa"
                keyboardType="decimal-pad"
                value={battery}
                onChangeText={setBattery}
              />
            </View>

            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.label}>Statut</Text>
              <View style={[styles.pickerContainer, { borderColor: getStatusStyle(status) }]}>
                <Picker
                  selectedValue={status}
                  onValueChange={(itemValue) => setStatus(itemValue)}
                  style={[styles.picker, { color: getStatusStyle(status) }]}
                  dropdownIconColor={getStatusStyle(status)}
                >
                  {SHIELD_STATUSES.map((s) => (
                    <Picker.Item
                      key={s.id}
                      label={`${s.icon} ${s.label}`}
                      value={s.id}
                      color={s.color}
                    />
                  ))}
                </Picker>
                <View style={styles.pickerIcon}>
                  <Ionicons name="chevron-down" size={20} color={getStatusStyle(status)} />
                </View>
              </View>
            </View>
          </View>

          {/* --- 3. Exploitation --- */}
          <SectionTitle index={3} label="Exploitation" />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Choisir une exploitation</Text>
            {exploitations.length === 0 ? (
              <Text style={{ color: "#666" }}>Chargement des exploitations...</Text>
            ) : exploitations.length === 1 ? (
              <Text style={styles.fixedValue}>{exploitations[0].name}</Text>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedExploitationId}
                  onValueChange={(itemValue) => {
                    if (itemValue) handleExploitationChange(itemValue);
                  }}
                  style={styles.picker}
                  dropdownIconColor="#14532d"
                >
                  <Picker.Item label="Sélectionnez une exploitation" value={null} />
                  {exploitations.map((exp) => (
                    <Picker.Item key={exp.id} label={exp.name} value={exp.id} />
                  ))}
                </Picker>
                <View style={styles.pickerIcon}>
                  <Ionicons name="chevron-down" size={20} color="#14532d" />
                </View>
              </View>
            )}
          </View>

          {/* --- 4. Association --- */}
          <SectionTitle index={4} label="Association" />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Animal</Text>

            {!selectedExploitationId ? (
              <Text style={{ color: "#999" }}>Veuillez d'abord sélectionner une exploitation.</Text>
            ) : loadingAnimals ? (
              <ActivityIndicator size="small" color={GREEN} />
            ) : animals.length === 0 ? (
              <Text style={{ color: "#999" }}>Aucun animal dans cette exploitation.</Text>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedAnimalId}
                  onValueChange={(itemValue) => setSelectedAnimalId(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#14532d"
                >
                  <Picker.Item label="Aucun animal" value={null} />
                  {animals.map((animal) => (
                    <Picker.Item
                      key={animal.id}
                      label={`${animal.name} (${animal.rfid})`}
                      value={animal.id}
                    />
                  ))}
                </Picker>
                <View style={styles.pickerIcon}>
                  <Ionicons name="chevron-down" size={20} color="#14532d" />
                </View>
              </View>
            )}
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

      {/* --- Modal clé API --- */}
      <Modal visible={!!createdShield} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="checkmark-circle" size={40} color={GREEN} />
            </View>

            <Text style={styles.modalTitle}>Bouclier créé</Text>
            <Text style={styles.modalSubtitle}>{createdShield?.ssmIotNumber}</Text>

            <Text style={styles.modalWarning}>
              Copiez cette clé API maintenant. Elle sert à configurer le capteur
              physique et ne sera plus jamais affichée après la fermeture de cet écran.
            </Text>

            <View style={styles.apiKeyBox}>
              <Text style={styles.apiKeyText} numberOfLines={2} selectable>
                {createdShield?.apiKey}
              </Text>
            </View>

            <Pressable style={styles.copyButton} onPress={handleCopyKey}>
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={16}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.copyButtonText}>
                {copied ? "Clé copiée" : "Copier la clé"}
              </Text>
            </Pressable>

            <Pressable style={styles.doneButton} onPress={handleCloseModal}>
              <Text style={styles.doneButtonText}>
                {copied ? "Terminé" : "J'ai copié la clé, continuer"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  fixedValue: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    color: "#1f2937",
  },

  pickerContainer: {
    position: "relative",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#1f2937",
    backgroundColor: "transparent",
  },
  pickerIcon: {
    position: "absolute",
    right: 14,
    top: 15,
    pointerEvents: "none",
  },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
  },
  modalIconWrap: { marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1f2937" },
  modalSubtitle: { fontSize: 14, color: "#666", marginTop: 2, marginBottom: 14 },
  modalWarning: {
    fontSize: 12,
    color: "#92400e",
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 10,
    textAlign: "center",
    marginBottom: 14,
  },
  apiKeyBox: {
    width: "100%",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 14,
  },
  apiKeyText: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#1f2937",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 10,
  },
  copyButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  doneButton: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  doneButtonText: { color: "#666", fontWeight: "600", fontSize: 13 },
});