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
import { getOrderById, updateOrder, type OrderStatus } from "../../../../../services/ordersService";
import { listProducts, type Product } from "../../../../../services/productsService";
import { listClients, type Client } from "../../../../../services/clientsService";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";
const BORDER = "#ECECE6";

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "BROUILLON", label: "Brouillon" },
  { value: "ENVOYE", label: "Envoyé" },
  { value: "VALIDE", label: "Validé" },
  { value: "EN_PREPARATION", label: "En préparation" },
  { value: "EXPEDIE", label: "Expédié" },
  { value: "LIVRE", label: "Livré" },
  { value: "FACTURE", label: "Facturé" },
  { value: "PAYE", label: "Payé" },
];

export default function EditOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [orderNumber, setOrderNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [status, setStatus] = useState<OrderStatus>("BROUILLON");
  const [notes, setNotes] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [tax, setTax] = useState("0");
  const [total, setTotal] = useState("");

  const [items, setItems] = useState<{ productId: number; productName: string; quantity: number; unitPrice: number; totalPrice: number }[]>([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const result = await getOrderById(Number(id));
      if (result.success) {
        setOrderNumber(result.order.orderNumber);
        setClientId(String(result.order.clientId));
        setClientName(result.order.clientName);
        setClientContact(result.order.clientContact);
        setStatus(result.order.status);
        setNotes(result.order.notes || "");
        setSubtotal(result.order.subtotal);
        setTax(result.order.tax);
        setTotal(result.order.total);
        setItems(
          result.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          }))
        );
      } else {
        setError(result.message || "Commande introuvable.");
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

  async function loadProducts() {
    const result = await listProducts({ page: 1, limit: 100 });
    if (result.success) {
      setProductsList(result.data);
    }
  }

  function handleClientSelect(client: Client) {
    setClientId(String(client.id));
    setClientName(client.name);
    setClientContact(client.contact);
    setShowClientPicker(false);
  }

  function handleProductSelect(product: Product) {
    const newItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: Number(product.price),
      totalPrice: Number(product.price),
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setShowProductPicker(false);
    recalculateTotals(newItems);
  }

  function recalculateTotals(currentItems: typeof items) {
    const sub = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxValue = Number(tax) || 0;
    setSubtotal(String(sub));
    setTotal(String(sub + taxValue));
  }

  function updateItemQuantity(index: number, quantity: number) {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].totalPrice = quantity * newItems[index].unitPrice;
    setItems(newItems);
    recalculateTotals(newItems);
  }

  function removeItem(index: number) {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    recalculateTotals(newItems);
  }

  function validate(): string | null {
    if (!orderNumber.trim()) return "Le numéro de commande est requis.";
    if (!clientId || Number.isNaN(Number(clientId))) return "Le client est requis.";
    if (!clientName.trim()) return "Le nom du client est requis.";
    if (!clientContact.trim()) return "Le contact du client est requis.";
    if (items.length === 0) return "Ajoutez au moins un article.";
    if (!subtotal || Number.isNaN(Number(subtotal))) return "Le sous-total est requis.";
    if (!total || Number.isNaN(Number(total))) return "Le total est requis.";
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

    const result = await updateOrder(Number(id), {
      orderNumber: orderNumber.trim(),
      clientId: Number(clientId),
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
      status,
      notes: notes.trim() || null,
      subtotal: Number(subtotal),
      tax: Number(tax) || 0,
      total: Number(total),
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
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
          <Text style={styles.headerTitle}>Modifier la commande</Text>
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
              <Text style={styles.label}>Numéro de commande</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : CMD-2024-001"
                placeholderTextColor="#B0B0B0"
                value={orderNumber}
                onChangeText={setOrderNumber}
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
                  {ORDER_STATUSES.find((s) => s.value === status)?.label}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#666" />
              </Pressable>
              {showStatusPicker && (
                <View style={styles.pickerOptions}>
                  {ORDER_STATUSES.map((s) => (
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

          <View style={styles.section}>
            <SectionHeader icon="cube-outline" label="Articles" />
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.itemDetail}>Qté: {item.quantity} x {item.unitPrice.toFixed(2)} MAD</Text>
                </View>
                <Text style={styles.itemTotal}>{item.totalPrice.toFixed(2)} MAD</Text>
                <Pressable style={styles.removeItemButton} onPress={() => removeItem(index)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </Pressable>
              </View>
            ))}
            <Pressable
              style={styles.addItemButton}
              onPress={async () => {
                await loadProducts();
                setShowProductPicker(!showProductPicker);
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color={GREEN} />
              <Text style={styles.addItemText}>Ajouter un article</Text>
            </Pressable>
            {showProductPicker && (
              <View style={styles.pickerOptions}>
                {productsList.map((product) => (
                  <Pressable
                    key={product.id}
                    style={styles.pickerOption}
                    onPress={() => handleProductSelect(product)}
                  >
                    <Text style={styles.pickerOptionText}>{product.name} - {Number(product.price).toFixed(2)} MAD</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader icon="calculator-outline" label="Totaux" />
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Sous-total (MAD)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#B0B0B0"
                value={subtotal}
                onChangeText={setSubtotal}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Taxe (MAD)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#B0B0B0"
                value={tax}
                onChangeText={setTax}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Total (MAD)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#B0B0B0"
                value={total}
                onChangeText={setTotal}
                keyboardType="numeric"
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

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#333" },
  itemDetail: { fontSize: 12, color: "#666", marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: "700", color: GREEN, marginRight: 8 },
  removeItemButton: { padding: 4 },

  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 8,
  },
  addItemText: { fontSize: 14, fontWeight: "600", color: GREEN, marginLeft: 6 },

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
