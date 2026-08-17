import { useCallback, useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import {
  getIotShieldById,
  updateIotShield,
  type IotShield,
  type SensorType,
  type ShieldStatus,
} from "../../../../services/iotShieldsService";
import {
  listAnimals,
  type Animal,
} from "../../../../services/animalsService";
import {
  listExploitations,
  type Exploitation,
} from "../../../../services/exploitationservice";
import { SENSOR_TYPES, SHIELD_STATUSES } from "../../../../constants/iot";
import { BackButton } from "../../../../components/BackButton";
import { Picker } from "@react-native-picker/picker";
import { usePermissions } from "../../../../contexts/PermissionsContext";

export default function EditIotShieldScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shieldId = Number(id);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Silent redirect if no update permission
  useEffect(() => {
    if (!hasPermission('IOT', 'SHIELDS:UPDATE')) {
      router.replace(`/iot/${id}/detail` as any);
    }
  }, [hasPermission, router, id]);

  const [ssmIotNumber, setSsmIotNumber] = useState("");
  const [sensorType, setSensorType] = useState<SensorType>("LOCALIZATION");
  const [battery, setBattery] = useState("100");
  const [status, setStatus] = useState<ShieldStatus>("ACTIVE");

  // --- Association ---
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [exploitations, setExploitations] = useState<Exploitation[]>([]);
  const [selectedExploitationId, setSelectedExploitationId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAnimals() {
    const result = await listAnimals({ page: 1, limit: 100 });
    if (result.success) {
      setAnimals(result.data);
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  async function loadExploitations() {
    const result = await listExploitations({ page: 1, limit: 100 });
    if (result.success) {
      setExploitations(result.data);
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  async function fetchShield() {
    const result = await getIotShieldById(shieldId);
    if (result.success) {
      const s = result.shield;
      setSsmIotNumber(s.ssmIotNumber);
      setSensorType(s.sensorType as SensorType);
      setBattery(s.battery ?? "100");
      setStatus(s.status as ShieldStatus);
      setSelectedAnimalId(s.animalId ?? null);
      setSelectedExploitationId(s.exploitationId ?? null);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([fetchShield(), loadAnimals(), loadExploitations()]).finally(() =>
        setLoading(false)
      );
    }, [shieldId])
  );

  function validate(): string | null {
    if (!/^SSM-IOT-\d+$/.test(ssmIotNumber.trim()))
      return "Le numéro SSM-IOT doit être au format SSM-IOT-XXXXXX.";
    if (battery && Number.isNaN(Number(battery)))
      return "La batterie doit être un nombre.";
    if (Number(battery) < 0 || Number(battery) > 100)
      return "La batterie doit être entre 0 et 100.";
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

    const result = await updateIotShield(shieldId, {
      ssmIotNumber: ssmIotNumber.trim(),
      sensorType,
      battery: battery ? Number(battery) : null,
      animalId: selectedAnimalId,
      status,
      exploitationId: selectedExploitationId,
    });

    setSaving(false);

    if (result.success) {
      router.back();
    } else {
      setError(result.message);
    }
  }

  const getStatusStyle = (statusId: ShieldStatus) => {
    const statusObj = SHIELD_STATUSES.find((s) => s.id === statusId);
    return statusObj ? statusObj.color : GREEN;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Modifier Bouclier IoT</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Modifier Bouclier IoT</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={48} color="#dc2626" />
          <Text style={styles.error}>{error}</Text>
        </View>
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
          <Text style={styles.headerTitle}>Modifier Bouclier IoT</Text>
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

          {/* --- 3. Association --- */}
          <SectionTitle index={3} label="Association" />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Animal</Text>

            {animals.length === 0 ? (
              <Text style={{ color: "#666" }}>Aucun animal disponible.</Text>
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

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Exploitation</Text>

            {exploitations.length === 0 ? (
              <Text style={{ color: "#666" }}>Aucune exploitation disponible.</Text>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedExploitationId}
                  onValueChange={(itemValue) => setSelectedExploitationId(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#14532d"
                >
                  <Picker.Item label="Aucune exploitation" value={null} />
                  {exploitations.map((exploitation) => (
                    <Picker.Item
                      key={exploitation.id}
                      label={exploitation.name}
                      value={exploitation.id}
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },

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
});