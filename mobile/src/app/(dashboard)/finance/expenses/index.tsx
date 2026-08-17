import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listExpenses, deleteExpense, type Expense } from '../../../../services/expenseService';
import { BackButton } from '../../../../components/BackButton';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { CATEGORY_LABELS, CATEGORY_COLORS, PAYMENT_METHOD_LABELS } from '../../../../constants/finance';

export default function ExpensesListScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Redirect if user cannot read expenses
  useEffect(() => {
    if (!hasPermission('FINANCE', 'EXPENSE:READ')) {
      router.replace('/finance');
    }
  }, [hasPermission, router]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = hasPermission('FINANCE', 'EXPENSE:CREATE');

  async function fetchExpenses() {
    setError(null);
    const result = await listExpenses();
    if (result.success) {
      setExpenses(result.data);
    } else {
      setError(result.message || 'Erreur de chargement');
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchExpenses().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  }

  async function handleDelete(id: number) {
    Alert.alert('Confirmer la suppression', 'Supprimer cette dépense ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteExpense(id);
          if (result.success) {
            setExpenses((prev) => prev.filter((e) => e.id !== id));
          } else {
            Alert.alert('Erreur', result.message || 'Échec de la suppression');
          }
        },
      },
    ]);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Dépenses</Text>
            <Text style={styles.subtitle}>
              {expenses.length} dépense{expenses.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Aucune dépense enregistrée</Text>
                <Text style={styles.emptySubtext}>
                  Ajoutez vos dépenses pour suivre votre trésorerie.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
              const color = CATEGORY_COLORS[item.category] || '#6b7280';
              const amount = parseFloat(item.amount);
              const paymentLabel = PAYMENT_METHOD_LABELS[item.paymentMethod] || item.paymentMethod;

              return (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.categoryBadge}>
                      <View style={[styles.categoryDot, { backgroundColor: color }]} />
                      <Text style={styles.categoryLabel}>{categoryLabel}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                  </View>

                  <View style={styles.cardMiddle}>
                    <Text style={styles.amount}>{amount.toFixed(2)} MAD</Text>
                    {item.beneficiary && (
                      <Text style={styles.beneficiary}>→ {item.beneficiary}</Text>
                    )}
                  </View>

                  <View style={styles.cardBottom}>
                    <Text style={styles.paymentMethod}>{paymentLabel}</Text>
                    {item.notes && (
                      <Text style={styles.notes} numberOfLines={1}>
                        {item.notes}
                      </Text>
                    )}
                  </View>

                  <View style={styles.cardActions}>
                    {hasPermission('FINANCE', 'EXPENSE:UPDATE') && (
                      <Pressable
                        style={styles.actionButton}
                        onPress={() =>
                          router.push({
                            pathname: '/finance/expenses/create',
                            params: { id: String(item.id) },
                          } as any)
                        }
                      >
                        <Ionicons name="create-outline" size={16} color="#14532d" />
                      </Pressable>
                    )}
                    {hasPermission('FINANCE', 'EXPENSE:DELETE') && (
                      <Pressable
                        style={[styles.actionButton, styles.actionDelete]}
                        onPress={() => handleDelete(item.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}

        {canCreate && (
          <Pressable
            style={styles.fab}
            onPress={() =>
              router.push({
                pathname: '/finance/expenses/create',
                params: {},
              } as any)
            }
          >
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, paddingHorizontal: 16 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  backButton: { marginRight: 8 },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },

  error: { color: '#dc2626', marginBottom: 8, fontSize: 13 },
  listContent: { paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  cardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  beneficiary: {
    fontSize: 13,
    color: '#666',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  notes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
  },
  actionDelete: {
    backgroundColor: '#fef2f2',
  },

  fab: {
    position: 'absolute',
    right: 4,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#0B4A24',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});