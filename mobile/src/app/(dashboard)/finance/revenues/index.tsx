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
import { listRevenues, deleteRevenue, type Revenue } from '../../../../services/revenueService';
import { BackButton } from '../../../../components/BackButton';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import {
  REVENUE_TYPE_LABELS,
  REVENUE_TYPE_COLORS,
  REVENUE_STATUS_LABELS,
  REVENUE_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '../../../../constants/finance';

export default function RevenuesListScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Redirect if no read permission
  useEffect(() => {
    if (!hasPermission('FINANCE', 'REVENUE:READ')) {
      router.replace('/finance');
    }
  }, [hasPermission, router]);

  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = hasPermission('FINANCE', 'REVENUE:CREATE');

  async function fetchRevenues() {
    setError(null);
    const result = await listRevenues();
    if (result.success) {
      setRevenues(result.data);
    } else {
      setError(result.message || 'Erreur de chargement');
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRevenues().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchRevenues();
    setRefreshing(false);
  }

  async function handleDelete(id: number) {
    Alert.alert('Confirmer la suppression', 'Supprimer ce revenu ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteRevenue(id);
          if (result.success) {
            setRevenues((prev) => prev.filter((r) => r.id !== id));
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

  function formatAmount(value: string): string {
    return parseFloat(value).toFixed(2);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.subtitle}>
              {revenues.length} revenu{revenues.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={revenues}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="cash-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Aucun revenu enregistré</Text>
                <Text style={styles.emptySubtext}>
                  Ajoutez vos ventes pour suivre votre chiffre d'affaires.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const typeLabel = REVENUE_TYPE_LABELS[item.type] || item.type;
              const color = REVENUE_TYPE_COLORS[item.type] || '#6b7280';
              const statusLabel = REVENUE_STATUS_LABELS[item.status] || item.status;
              const statusColor = REVENUE_STATUS_COLORS[item.status] || '#6b7280';
              const paymentLabel = PAYMENT_METHOD_LABELS[item.paymentMethod] || item.paymentMethod;

              return (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.typeBadge}>
                      <View style={[styles.typeDot, { backgroundColor: color }]} />
                      <Text style={styles.typeLabel}>{typeLabel}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                  </View>

                  <View style={styles.cardMiddle}>
                    <Text style={styles.amount}>{formatAmount(item.totalTTC)} MAD</Text>
                    {item.buyer && (
                      <Text style={styles.buyer}>→ {item.buyer}</Text>
                    )}
                  </View>

                  <View style={styles.cardBottom}>
                    <View style={styles.statusBadge}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                    <Text style={styles.paymentMethod}>{paymentLabel}</Text>
                  </View>

                  {item.notes && (
                    <Text style={styles.notes} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  )}

                  <View style={styles.cardActions}>
                    {hasPermission('FINANCE', 'REVENUE:UPDATE') && (
                      <Pressable
                        style={styles.actionButton}
                        onPress={() =>
                          router.push({
                            pathname: '/finance/revenues/create',
                            params: { id: String(item.id) },
                          } as any)
                        }
                      >
                        <Ionicons name="create-outline" size={16} color="#14532d" />
                      </Pressable>
                    )}
                    {hasPermission('FINANCE', 'REVENUE:DELETE') && (
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
                pathname: '/finance/revenues/create',
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
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 16,
  },
  backButton: { marginRight: 8 },
  headerTitleContainer: { flex: 1 },
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeLabel: {
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
  buyer: {
    fontSize: 13,
    color: '#666',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginTop: 4,
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