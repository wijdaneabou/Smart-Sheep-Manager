import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import {
  createRevenue,
  updateRevenue,
  getRevenueById,
  type CreateRevenueData,
} from '../../../../services/revenueService';
import {
  REVENUE_TYPES,
  REVENUE_TYPE_LABELS,
  REVENUE_TYPE_COLORS,
  REVENUE_STATUSES,
  REVENUE_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type RevenueType,
  type RevenueStatus,
  type PaymentMethod,
} from '../../../../constants/finance';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { listExploitations } from '../../../../services/exploitationservice';
import { BackButton } from '../../../../components/BackButton';

export default function CreateRevenueScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const revenueId = id ? parseInt(id) : undefined;
  const { hasPermission } = usePermissions();

  useEffect(() => {
    const requiredAction = revenueId ? 'REVENUE:UPDATE' : 'REVENUE:CREATE';
    if (!hasPermission('FINANCE', requiredAction)) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas les droits pour effectuer cette action.');
      router.replace('..');
    }
  }, [hasPermission, router, revenueId]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exploitations, setExploitations] = useState<{ id: number; name: string }[]>([]);
  const [selectedExploitation, setSelectedExploitation] = useState<number | null>(null);

  const [form, setForm] = useState<{
    date: string;
    type: RevenueType | '';
    quantity: string;
    unitPrice: string;
    totalHT: string;
    totalTTC: string;
    buyer: string;
    paymentMethod: PaymentMethod | '';
    status: RevenueStatus | '';
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    type: '',
    quantity: '',
    unitPrice: '',
    totalHT: '',
    totalTTC: '',
    buyer: '',
    paymentMethod: 'CASH',
    status: 'PENDING',
    notes: '',
  });

  useEffect(() => {
    async function loadExploitations() {
      try {
        const result = await listExploitations();
        if (result.success && result.data) {
          setExploitations(result.data);
          if (result.data.length === 1) {
            setSelectedExploitation(result.data[0].id);
          }
        } else {
          Alert.alert('Erreur', result.message || 'Impossible de charger les exploitations.');
        }
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger les exploitations.');
      }
    }
    loadExploitations();
  }, []);

  useEffect(() => {
    if (revenueId) {
      setLoading(true);
      getRevenueById(revenueId).then((result) => {
        if (result.success && result.data) {
          const r = result.data;
          setSelectedExploitation(r.exploitationId);
          setForm({
            date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            type: r.type,
            quantity: r.quantity || '',
            unitPrice: r.unitPrice || '',
            totalHT: r.totalHT,
            totalTTC: r.totalTTC,
            buyer: r.buyer || '',
            paymentMethod: r.paymentMethod || 'CASH',
            status: r.status || 'PENDING',
            notes: r.notes || '',
          });
        } else {
          Alert.alert('Erreur', result.message || 'Revenu introuvable.');
          router.replace('..');
        }
        setLoading(false);
      });
    }
  }, [revenueId]);

  async function handleSubmit() {
    if (!selectedExploitation) {
      setError('Veuillez sélectionner une exploitation.');
      return;
    }
    if (!form.date) {
      setError('Veuillez sélectionner une date.');
      return;
    }
    if (!form.type) {
      setError('Veuillez sélectionner un type.');
      return;
    }
    if (!form.paymentMethod) {
      setError('Veuillez sélectionner un mode de paiement.');
      return;
    }
    if (!form.status) {
      setError('Veuillez sélectionner un statut.');
      return;
    }
    const totalHT = parseFloat(form.totalHT);
    const totalTTC = parseFloat(form.totalTTC);
    if (isNaN(totalHT) || totalHT < 0) {
      setError('Le montant HT doit être un nombre positif.');
      return;
    }
    if (isNaN(totalTTC) || totalTTC < 0) {
      setError('Le montant TTC doit être un nombre positif.');
      return;
    }
    const quantity = form.quantity ? parseFloat(form.quantity) : null;
    const unitPrice = form.unitPrice ? parseFloat(form.unitPrice) : null;

    setSaving(true);
    setError(null);

    const data: CreateRevenueData = {
      exploitationId: selectedExploitation,
      date: new Date(form.date).toISOString(),
      type: form.type as RevenueType,
      quantity: quantity,
      unitPrice: unitPrice,
      totalHT: totalHT,
      totalTTC: totalTTC,
      buyer: form.buyer || undefined,
      paymentMethod: form.paymentMethod as PaymentMethod,
      status: form.status as RevenueStatus,
      notes: form.notes || undefined,
    };

    let result;
    if (revenueId) {
      result = await updateRevenue(revenueId, data);
    } else {
      result = await createRevenue(data);
    }

    setSaving(false);

    if (result.success) {
      Alert.alert('Succès', revenueId ? 'Revenu mis à jour' : 'Revenu créé');
      router.replace('..');
    } else {
      setError(result.message || 'Erreur lors de l\'enregistrement');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#14532d" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>
            {revenueId ? 'Modifier le revenu' : 'Nouveau revenu'}
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Exploitation */}
          <View style={styles.field}>
            <Text style={styles.label}>Exploitation *</Text>
            {exploitations.length === 0 ? (
              <Text style={styles.hint}>Chargement...</Text>
            ) : exploitations.length === 1 ? (
              <Text style={styles.value}>{exploitations[0].name}</Text>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedExploitation}
                  onValueChange={(itemValue) => setSelectedExploitation(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Sélectionnez une exploitation" value={null} />
                  {exploitations.map((exp) => (
                    <Picker.Item key={exp.id} label={exp.name} value={exp.id} />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-JJ"
              value={form.date}
              onChangeText={(text) => setForm({ ...form, date: text })}
            />
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Text style={styles.label}>Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.type}
                onValueChange={(itemValue) => setForm({ ...form, type: itemValue as RevenueType | '' })}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez un type" value="" />
                {REVENUE_TYPES.map((t) => (
                  <Picker.Item
                    key={t}
                    label={REVENUE_TYPE_LABELS[t] || t}
                    value={t}
                    color={REVENUE_TYPE_COLORS[t] || '#000'}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Quantité */}
          <View style={styles.field}>
            <Text style={styles.label}>Quantité</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="decimal-pad"
              value={form.quantity}
              onChangeText={(text) => setForm({ ...form, quantity: text })}
            />
          </View>

          {/* Prix unitaire */}
          <View style={styles.field}>
            <Text style={styles.label}>Prix unitaire (MAD)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.unitPrice}
              onChangeText={(text) => setForm({ ...form, unitPrice: text })}
            />
          </View>

          {/* Total HT */}
          <View style={styles.field}>
            <Text style={styles.label}>Total HT (MAD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.totalHT}
              onChangeText={(text) => setForm({ ...form, totalHT: text })}
            />
          </View>

          {/* Total TTC */}
          <View style={styles.field}>
            <Text style={styles.label}>Total TTC (MAD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.totalTTC}
              onChangeText={(text) => setForm({ ...form, totalTTC: text })}
            />
          </View>

          {/* Acheteur */}
          <View style={styles.field}>
            <Text style={styles.label}>Acheteur</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom de l'acheteur"
              value={form.buyer}
              onChangeText={(text) => setForm({ ...form, buyer: text })}
            />
          </View>

          {/* Mode de paiement */}
          <View style={styles.field}>
            <Text style={styles.label}>Mode de paiement *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.paymentMethod}
                onValueChange={(itemValue) => setForm({ ...form, paymentMethod: itemValue as PaymentMethod | '' })}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez un mode" value="" />
                {PAYMENT_METHODS.map((m) => (
                  <Picker.Item
                    key={m}
                    label={PAYMENT_METHOD_LABELS[m] || m}
                    value={m}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Statut */}
          <View style={styles.field}>
            <Text style={styles.label}>Statut *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.status}
                onValueChange={(itemValue) => setForm({ ...form, status: itemValue as RevenueStatus | '' })}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez un statut" value="" />
                {REVENUE_STATUSES.map((s) => (
                  <Picker.Item
                    key={s}
                    label={REVENUE_STATUS_LABELS[s] || s}
                    value={s}
                    color={s === 'COLLECTED' ? '#16a34a' : '#f59e0b'}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Commentaires"
              multiline
              numberOfLines={3}
              value={form.notes}
              onChangeText={(text) => setForm({ ...form, notes: text })}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actionsRow}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>ANNULER</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {revenueId ? 'MODIFIER' : 'ENREGISTRER'}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const GREEN = '#14532d';
const BORDER = '#e5e0d8';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#faf6f1' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { marginRight: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: GREEN },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingTop: 4, flexGrow: 1 },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: { height: 50, width: '100%' },
  hint: { fontSize: 14, color: '#888' },
  value: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },

  error: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
  },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: { color: '#444', fontWeight: '700', fontSize: 13 },
  submitButton: {
    flex: 2,
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});