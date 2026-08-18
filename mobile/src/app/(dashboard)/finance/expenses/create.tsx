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
  createExpense,
  updateExpense,
  getExpenseById,
  type CreateExpenseData,
} from '../../../../services/expenseService';
import {
  EXPENSE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type ExpenseCategory,
  type PaymentMethod,
} from '../../../../constants/finance';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { listExploitations } from '../../../../services/exploitationservice';
import { BackButton } from '../../../../components/BackButton';

export default function CreateExpenseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const expenseId = id ? parseInt(id) : undefined;
  const { hasPermission } = usePermissions();

  // Redirect if user cannot create or update expenses
  useEffect(() => {
    const requiredAction = expenseId ? 'EXPENSE:UPDATE' : 'EXPENSE:CREATE';
    if (!hasPermission('FINANCE', requiredAction)) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas les droits pour effectuer cette action.');
      
      router.replace('..');
    }
  }, [hasPermission, router, expenseId]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exploitations, setExploitations] = useState<{ id: number; name: string }[]>([]);
  const [selectedExploitation, setSelectedExploitation] = useState<number | null>(null);

  const [form, setForm] = useState<{
    date: string;
    amount: string;
    category: ExpenseCategory | '';
    beneficiary: string;
    paymentMethod: PaymentMethod | '';
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    beneficiary: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  // Load exploitations for the user
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

  // If editing, fetch existing expense
  useEffect(() => {
    if (expenseId) {
      setLoading(true);
      getExpenseById(expenseId).then((result) => {
        if (result.success && result.data) {
          const e = result.data;
          setSelectedExploitation(e.exploitationId);
          setForm({
            date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
            amount: e.amount,
            category: e.category,
            beneficiary: e.beneficiary || '',
            paymentMethod: e.paymentMethod || 'CASH',
            notes: e.notes || '',
          });
        } else {
          Alert.alert('Erreur', result.message || 'Dépense introuvable.');
          // ✅ Fix: use relative path to go back to expenses list
          router.replace('..');
        }
        setLoading(false);
      });
    }
  }, [expenseId]);

  async function handleSubmit() {
    // Validation
    if (!selectedExploitation) {
      setError('Veuillez sélectionner une exploitation.');
      return;
    }
    if (!form.date) {
      setError('Veuillez sélectionner une date.');
      return;
    }
    if (!form.category) {
      setError('Veuillez sélectionner une catégorie.');
      return;
    }
    if (!form.paymentMethod) {
      setError('Veuillez sélectionner un mode de paiement.');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Le montant doit être un nombre positif.');
      return;
    }

    setSaving(true);
    setError(null);

    const data: CreateExpenseData = {
      exploitationId: selectedExploitation,
      date: new Date(form.date).toISOString(),
      amount: amount,
      category: form.category as ExpenseCategory,
      beneficiary: form.beneficiary || undefined,
      paymentMethod: form.paymentMethod as PaymentMethod,
      notes: form.notes || undefined,
    };

    let result;
    if (expenseId) {
      result = await updateExpense(expenseId, data);
    } else {
      result = await createExpense(data);
    }

    setSaving(false);

    if (result.success) {
      Alert.alert('Succès', expenseId ? 'Dépense mise à jour' : 'Dépense créée');
      // ✅ Fix: use back to go to previous screen (expenses list)
      router.back();
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

          {/* Montant */}
          <View style={styles.field}>
            <Text style={styles.label}>Montant (MAD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.amount}
              onChangeText={(text) => setForm({ ...form, amount: text })}
            />
          </View>

          {/* Catégorie */}
          <View style={styles.field}>
            <Text style={styles.label}>Catégorie *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.category}
                onValueChange={(itemValue) => setForm({ ...form, category: itemValue as ExpenseCategory | '' })}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez une catégorie" value="" />
                {EXPENSE_CATEGORIES.map((cat) => (
                  <Picker.Item
                    key={cat}
                    label={CATEGORY_LABELS[cat] || cat}
                    value={cat}
                    color={CATEGORY_COLORS[cat] || '#000'}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Bénéficiaire */}
          <View style={styles.field}>
            <Text style={styles.label}>Bénéficiaire</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du fournisseur ou bénéficiaire"
              value={form.beneficiary}
              onChangeText={(text) => setForm({ ...form, beneficiary: text })}
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
                {PAYMENT_METHODS.map((method) => (
                  <Picker.Item
                    key={method}
                    label={PAYMENT_METHOD_LABELS[method] || method}
                    value={method}
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
                  {expenseId ? 'MODIFIER' : 'ENREGISTRER'}
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
    marginTop: 0,
  },
  backButton: { marginRight: 8 },
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

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
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