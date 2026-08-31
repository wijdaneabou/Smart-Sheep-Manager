import { useState, useEffect } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getFrameworkContractById, updateFrameworkContract, type ContractStatus } from "../../../../../services/frameworkContractsService";
import { listClients, type Client } from "../../../../../services/clientsService";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";
const BORDER = "#ECECE6";

const CONTRACT_STATUSES: { value: ContractStatus; label: string }[] = [
  { value: "EN_NEGOCIATION", label: "En négociation" },
  { value: "ACTIF", label: "Actif" },
  { value: "EXPIRE", label: "Expiré" },
  { value: "RESILIE", label: "Résilié" },
];

export default function EditFrameworkContractScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [contractNumber, setContractNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [yearlyVolume, setYearlyVolume] = useState("");
  const [negotiatedPrice, setNegotiatedPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<ContractStatus>("EN_NEGOCIATION");
  const [clauses, setClauses] = useState("");
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");

  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const [clientsList, setClientsList] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const result = await getFrameworkContractById(Number(id));
      if (result.success) {
        setContractNumber(result.contract.contractNumber);
        setClientId(String(result.contract.clientId));
        setClientName(result.contract.clientName);
        setMonthlyVolume(result.contract.monthlyVolume);
        setYearlyVolume(result.contract.yearlyVolume);
        setNegotiatedPrice(result.contract.negotiatedPrice);
        setStartDate(result.contract.startDate);
        setEndDate(result.contract.endDate);
        setStatus(result.contract.status);
        setClauses(result.contract.clauses || "");
        setSchedule(result.contract.schedule || "");
        setNotes(result.contract.notes || "");
      } else {
        setError(result.message || "Contrat introuvable.");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function loadClients() {
    const result = await listClients({ page: 1, limit: 100 });
    if (result.success) {
      setClientsList(result.data);
    }
  }

  function handleClientSelect(client: Client) {
    setClientId(String(client.id));
    setClientName(client.name);
    setShowClientPicker(false);
  }

  function validate(): string | null {
    if (!contractNumber.trim()) return "Le numéro de contrat est requis.";
    if (!clientId || Number.isNaN(Number(clientId))) return "Le client est requis.";
    if (!clientName.trim()) return "Le nom du client est requis.";
    if (!monthlyVolume.trim()) return "Le volume mensuel est requis.";
    if (!yearlyVolume.trim()) return "Le volume annuel est requis.";
    if (!negotiatedPrice.trim()) return "Le prix négocié est requis.";
    if (!startDate.trim()) return "La date de début est requise.";
    if (!endDate.trim()) return "La date de fin est requise.";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await updateFrameworkContract(Number(id), {
      contractNumber: contractNumber.trim(),
      clientId: Number(clientId),
      clientName: clientName.trim(),
      monthlyVolume: monthlyVolume.trim(),
      yearlyVolume: yearlyVolume.trim(),
      negotiatedPrice: negotiatedPrice.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      status,
      clauses: clauses.trim() || null,
      schedule: schedule.trim() || null,
      notes: notes.trim() || null,
    });

    setSubmitting(false);

    if (result.success) {
      router.back();
    } else {
      setError(result.message);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
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
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Modifier le contrat</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <SectionHeader icon="document-outline" label="Informations générales" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Numéro de contrat</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : CT-2024-001"
                placeholderTextColor="#B0B0B0"
                value={contractNumber}
                onChangeText={setContractNumber}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Client</Text>
              <Pressable
                style={styles.pickerTrigger}
                onPress={async () => {
                  await loadClients();
                  setShowClientPicker(!showClientPicker);
                }}
              >
                <Text style={styles.pickerText} numberOfLines={1}>
                  {clientName || "Sélectionner un client"}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#666" />
              </Pressable>
              {showClientPicker && (
                <View style={styles.pickerOptions}>
                  {clientsList.map((client) => (
                    <Pressable
                      key={client.id}
                      style={[styles.pickerOption, clientId === String(client.id) && styles.pickerOptionActive]}
                      onPress={() => handleClientSelect(client)}
                    >
                      <Text style={[styles.pickerOptionText, clientId === String(client.id) && styles.pickerOptionTextActive]}>
                        {client.name} - {client.contact}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Statut</Text>
              <Pressable
                style={styles.pickerTrigger}
                onPress={() => setShowStatusPicker(!showStatusPicker)}
              >
                <Text style={styles.pickerText}>
                  {CONTRACT_STATUSES.find((s) => s.value === status)?.label}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#666" />
              </Pressable>
              {showStatusPicker && (
                <View style={styles.pickerOptions}>
                  {CONTRACT_STATUSES.map((s) => (
                    <Pressable
                      key={s.value}
                      style={[styles.pickerOption, status === s.value && styles.pickerOptionActive]}
                      onPress={() => {
                        setStatus(s.value);
                        setShowStatusPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, status === s.value && styles.pickerOptionTextActive]}>
                        {s.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="calculator-outline" label="Volumes & Prix" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Volume mensuel</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : 100 kg"
                placeholderTextColor="#B0B0B0"
                value={monthlyVolume}
                onChangeText={setMonthlyVolume}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Volume annuel</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : 1200 kg"
                placeholderTextColor="#B0B0B0"
                value={yearlyVolume}
                onChangeText={setYearlyVolume}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Prix négocié</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : 15 MAD/kg"
                placeholderTextColor="#B0B0B0"
                value={negotiatedPrice}
                onChangeText={setNegotiatedPrice}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="calendar-outline" label="Durée" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Date de début</Text>
              <TextInput
                style={styles.input}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor="#B0B0B0"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Date de fin</Text>
              <TextInput
                style={styles.input}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor="#B0B0B0"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="document-text-outline" label="Clauses & Échéancier" />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Clauses</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Clauses contractuelles..."
                placeholderTextColor="#B0B0B0"
                value={clauses}
                onChangeText={setClauses}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Échéancier</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Échéancier de paiement / livraison..."
                placeholderTextColor="#B0B0B0"
                value={schedule}
                onChangeText={setSchedule}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes diverses..."
                placeholderTextColor="#B0B0B0"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Enregistrer</Text>
              </>
            )}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CREAM },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN },

  container: { padding: 16, paddingTop: 4, paddingBottom: 40, flexGrow: 1 },

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

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerText: { fontSize: 15, color: "#1f2937" },
  pickerOptions: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    maxHeight: 200,
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerOptionActive: { backgroundColor: "#DCFCE7" },
  pickerOptionText: { fontSize: 15, color: "#333" },
  pickerOptionTextActive: { color: GREEN, fontWeight: "700" },

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

  button: {
    flexDirection: "row",
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
