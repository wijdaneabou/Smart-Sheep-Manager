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
import { getDeliveryById, updateDelivery, type DeliveryStatus } from "../../../../../services/deliveriesService";
import { listClients, type Client } from "../../../../../services/clientsService";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";
const BORDER = "#ECECE6";

const DELIVERY_STATUSES: { value: DeliveryStatus; label: string }[] = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "EN_COURS", label: "En cours" },
  { value: "LIVRE", label: "Livré" },
];

export default function EditDeliveryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [address, setAddress] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState<DeliveryStatus>("EN_ATTENTE");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
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
      const result = await getDeliveryById(Number(id));
      if (result.success) {
        setDeliveryNumber(result.delivery.deliveryNumber);
        setDeliveryDate(result.delivery.deliveryDate);
        setAddress(result.delivery.address);
        setCarrier(result.delivery.carrier);
        setTrackingNumber(result.delivery.trackingNumber);
        setStatus(result.delivery.status);
        setDeliveryNote(result.delivery.deliveryNote || "");
        setClientId(result.delivery.clientId ? String(result.delivery.clientId) : "");
        setClientName(result.delivery.clientName);
        setClientContact(result.delivery.clientContact);
        setNotes(result.delivery.notes || "");
      } else {
        setError(result.message || "Livraison introuvable.");
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
    setClientContact(client.contact);
    setShowClientPicker(false);
  }

  function validate(): string | null {
    if (!deliveryNumber.trim()) return "Le numéro de livraison est requis.";
    if (!deliveryDate.trim()) return "La date de livraison est requise.";
    if (!address.trim()) return "L'adresse est requise.";
    if (!carrier.trim()) return "Le transporteur est requis.";
    if (!trackingNumber.trim()) return "Le numéro de suivi est requis.";
    if (!clientName.trim()) return "Le nom du client est requis.";
    if (!clientContact.trim()) return "Le contact du client est requis.";
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

    const result = await updateDelivery(Number(id), {
      deliveryNumber: deliveryNumber.trim(),
      status,
      deliveryDate: deliveryDate.trim(),
      address: address.trim(),
      carrier: carrier.trim(),
      trackingNumber: trackingNumber.trim(),
      deliveryNote: deliveryNote.trim() || null,
      clientId: clientId ? Number(clientId) : null,
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
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
          <Text style={styles.headerTitle}>Modifier la livraison</Text>
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
              <Text style={styles.label}>Numéro de livraison</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : LIV-2024-001"
                placeholderTextColor="#B0B0B0"
                value={deliveryNumber}
                onChangeText={setDeliveryNumber}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Date de livraison</Text>
              <TextInput
                style={styles.input}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor="#B0B0B0"
                value={deliveryDate}
                onChangeText={setDeliveryDate}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Adresse</Text>
              <TextInput
                style={styles.input}
                placeholder="Adresse de livraison"
                placeholderTextColor="#B0B0B0"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Transporteur</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom du transporteur"
                placeholderTextColor="#B0B0B0"
                value={carrier}
                onChangeText={setCarrier}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Numéro de suivi</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro de tracking"
                placeholderTextColor="#B0B0B0"
                value={trackingNumber}
                onChangeText={setTrackingNumber}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Statut</Text>
              <Pressable
                style={styles.pickerTrigger}
                onPress={() => setShowStatusPicker(!showStatusPicker)}
              >
                <Text style={styles.pickerText}>
                  {DELIVERY_STATUSES.find((s) => s.value === status)?.label}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#666" />
              </Pressable>
              {showStatusPicker && (
                <View style={styles.pickerOptions}>
                  {DELIVERY_STATUSES.map((s) => (
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

            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Bon de livraison</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Détails du bon de livraison..."
                placeholderTextColor="#B0B0B0"
                value={deliveryNote}
                onChangeText={setDeliveryNote}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="person-outline" label="Client" />

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
              <Text style={styles.label}>Nom du client</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom du client"
                placeholderTextColor="#B0B0B0"
                value={clientName}
                onChangeText={setClientName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contact du client</Text>
              <TextInput
                style={styles.input}
                placeholder="Téléphone ou email"
                placeholderTextColor="#B0B0B0"
                value={clientContact}
                onChangeText={setClientContact}
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
