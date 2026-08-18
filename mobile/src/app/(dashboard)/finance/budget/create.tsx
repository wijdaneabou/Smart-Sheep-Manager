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
  createBudget,
  updateBudget,
  getBudgetById,
  type CreateBudgetData,
} from '../../../../services/budgetService';
import {
  BUDGET_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type BudgetCategory,
} from '../../../../constants/finance';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { listExploitations } from '../../../../services/exploitationservice';
import { BackButton } from '../../../../components/BackButton';

export default function CreateBudgetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const budgetId = id ? parseInt(id) : undefined;
  const { hasPermission } = usePermissions();

  // Redirect if user cannot create or update budgets
  useEffect(() => {
    const requiredAction = budgetId ? 'BUDGET:UPDATE' : 'BUDGET:CREATE';
    if (!hasPermission('FINANCE', requiredAction)) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas les droits pour effectuer cette action.');
      router.replace('/finance');
    }
  }, [hasPermission, router, budgetId]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exploitations, setExploitations] = useState<{ id: number; name: string }[]>([]);
  const [selectedExploitation, setSelectedExploitation] = useState<number | null>(null);

  const [form, setForm] = useState<{
    year: string;
    month: string;
    category: BudgetCategory | '';
    plannedAmount: string;
    notes: string;
  }>({
    year: new Date().getFullYear().toString(),
    month: '',
    category: '',
    plannedAmount: '',
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

  // If editing, fetch existing budget
  useEffect(() => {
    if (budgetId) {
      setLoading(true);
      getBudgetById(budgetId).then((result) => {
        if (result.success && result.data) {
          const b = result.data;
          setSelectedExploitation(b.exploitationId);
          setForm({
            year: String(b.year),
            month: b.month ? String(b.month) : '',
            category: b.category,
            plannedAmount: b.plannedAmount,
            notes: b.notes || '',
          });
        } else {
          Alert.alert('Erreur', result.message || 'Budget introuvable.');
          router.replace('/finance');
        }
        setLoading(false);
      });
    }
  }, [budgetId]);

  async function handleSubmit() {
    // Validation
    if (!selectedExploitation) {
      setError('Veuillez sélectionner une exploitation.');
      return;
    }
    const yearNum = parseInt(form.year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      setError('Année invalide (entre 2000 et 2100).');
      return;
    }
    const monthNum = form.month ? parseInt(form.month) : null;
    if (monthNum !== null && (isNaN(monthNum) || monthNum < 1 || monthNum > 12)) {
      setError('Mois invalide (1-12).');
      return;
    }
    if (!form.category) {
      setError('Veuillez sélectionner une catégorie.');
      return;
    }
    const planned = parseFloat(form.plannedAmount);
    if (isNaN(planned) || planned < 0) {
      setError('Le montant prévu doit être un nombre positif.');
      return;
    }

    setSaving(true);
    setError(null);

    const data: CreateBudgetData = {
      exploitationId: selectedExploitation,
      year: yearNum,
      month: monthNum,
      category: form.category as BudgetCategory,
      plannedAmount: planned,
      notes: form.notes || undefined,
    };

    let result;
    if (budgetId) {
      result = await updateBudget(budgetId, data);
    } else {
      result = await createBudget(data);
    }

    setSaving(false);

    if (result.success) {
      Alert.alert('Succès', budgetId ? 'Budget mis à jour' : 'Budget créé');
      router.replace('/finance');
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

          {/* Année */}
          <View style={styles.field}>
            <Text style={styles.label}>Année *</Text>
            <TextInput
              style={styles.input}
              placeholder="2026"
              keyboardType="numeric"
              value={form.year}
              onChangeText={(text) => setForm({ ...form, year: text })}
            />
          </View>

          {/* Mois (optionnel) */}
          <View style={styles.field}>
            <Text style={styles.label}>Mois (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="1-12"
              keyboardType="numeric"
              value={form.month}
              onChangeText={(text) => setForm({ ...form, month: text })}
            />
          </View>

          {/* Catégorie */}
          <View style={styles.field}>
            <Text style={styles.label}>Catégorie *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.category}
                onValueChange={(itemValue) => setForm({ ...form, category: itemValue as BudgetCategory | '' })}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez une catégorie" value="" />
                {BUDGET_CATEGORIES.map((cat) => (
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

          {/* Montant prévu */}
          <View style={styles.field}>
            <Text style={styles.label}>Montant prévu (MAD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.plannedAmount}
              onChangeText={(text) => setForm({ ...form, plannedAmount: text })}
            />
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
                  {budgetId ? 'MODIFIER' : 'ENREGISTRER'}
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