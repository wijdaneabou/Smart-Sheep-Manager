import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../../../../components/BackButton';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { getCostOfProduction, type CostOfProduction } from '../../../../services/costService';
import { CATEGORY_COLORS } from '../../../../constants/finance';

export default function CostScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (!hasPermission('FINANCE', 'COST:READ')) {
      router.replace('/finance');
    }
  }, [hasPermission, router]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CostOfProduction | null>(null);

  // Period state
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const getDefaultPeriod = () => {
    const now = new Date();
    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: start.toISOString(), end: end.toISOString() };
    } else if (period === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      const startMonth = quarter * 3;
      const start = new Date(now.getFullYear(), startMonth, 1);
      const end = new Date(now.getFullYear(), startMonth + 3, 0);
      return { start: start.toISOString(), end: end.toISOString() };
    } else if (period === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { start: start.toISOString(), end: end.toISOString() };
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: start.toISOString(), end: end.toISOString() };
    }
  };

  const fetchData = useCallback(async () => {
    setError(null);
    const { start, end } = getDefaultPeriod();
    setStartDate(start);
    setEndDate(end);
    const result = await getCostOfProduction(start, end);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.message || 'Erreur de chargement');
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    }, [fetchData])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  function formatCurrency(value: number): string {
    return value.toFixed(2) + ' MAD';
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
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.subtitle}>par kg de viande</Text>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.periodRow}>
            <Pressable
              style={[styles.periodPill, period === 'month' && styles.periodPillActive]}
              onPress={() => setPeriod('month')}
            >
              <Text style={[styles.periodPillText, period === 'month' && styles.periodPillTextActive]}>Mois</Text>
            </Pressable>
            <Pressable
              style={[styles.periodPill, period === 'quarter' && styles.periodPillActive]}
              onPress={() => setPeriod('quarter')}
            >
              <Text style={[styles.periodPillText, period === 'quarter' && styles.periodPillTextActive]}>Trimestre</Text>
            </Pressable>
            <Pressable
              style={[styles.periodPill, period === 'year' && styles.periodPillActive]}
              onPress={() => setPeriod('year')}
            >
              <Text style={[styles.periodPillText, period === 'year' && styles.periodPillTextActive]}>Année</Text>
            </Pressable>
            <Pressable
              style={[styles.periodPill, period === 'custom' && styles.periodPillActive]}
              onPress={() => setPeriod('custom')}
            >
              <Text style={[styles.periodPillText, period === 'custom' && styles.periodPillTextActive]}>Personnalisé</Text>
            </Pressable>
          </View>

          {data && (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Période</Text>
                <Text style={styles.summaryValue}>
                  {new Date(data.period.startDate).toLocaleDateString('fr-FR')} – {new Date(data.period.endDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>

              <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { borderLeftColor: '#16a34a' }]}>
                  <Text style={styles.kpiLabel}>Coût total</Text>
                  <Text style={[styles.kpiValue, { color: '#1f2937' }]}>
                    {formatCurrency(data.totalCost)}
                  </Text>
                </View>
                <View style={[styles.kpiCard, { borderLeftColor: '#2563eb' }]}>
                  <Text style={styles.kpiLabel}>Poids gagné</Text>
                  <Text style={[styles.kpiValue, { color: '#1f2937' }]}>
                    {data.totalWeightGained.toFixed(2)} kg
                  </Text>
                </View>
                <View style={[styles.kpiCard, { borderLeftColor: '#7c3aed' }]}>
                  <Text style={styles.kpiLabel}>Coût / kg</Text>
                  <Text style={[styles.kpiValue, { color: '#7c3aed' }]}>
                    {data.costPerKg.toFixed(2)} MAD/kg
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>Coûts directs</Text>
                {data.directCosts.length === 0 ? (
                  <Text style={styles.detailEmpty}>Aucun coût direct</Text>
                ) : (
                  data.directCosts.map((c, i) => (
                    <View key={i} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{c.category}</Text>
                      <Text style={styles.detailAmount}>{formatCurrency(c.total)}</Text>
                    </View>
                  ))
                )}
                <View style={styles.detailTotal}>
                  <Text style={styles.detailTotalLabel}>Total directs</Text>
                  <Text style={styles.detailTotalAmount}>{formatCurrency(data.totalDirectCost)}</Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>Coûts indirects</Text>
                {data.indirectCosts.length === 0 ? (
                  <Text style={styles.detailEmpty}>Aucun coût indirect</Text>
                ) : (
                  data.indirectCosts.map((c, i) => (
                    <View key={i} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{c.category}</Text>
                      <Text style={styles.detailAmount}>{formatCurrency(c.total)}</Text>
                    </View>
                  ))
                )}
                <View style={styles.detailTotal}>
                  <Text style={styles.detailTotalLabel}>Total indirects</Text>
                  <Text style={styles.detailTotalAmount}>{formatCurrency(data.totalIndirectCost)}</Text>
                </View>
              </View>

              {data.benchmark && data.benchmark.averageCostPerKg > 0 && (
                <View style={styles.benchmarkCard}>
                  <Text style={styles.benchmarkTitle}>Benchmark</Text>
                  <Text style={styles.benchmarkText}>
                    Coût moyen des exploitations similaires: {formatCurrency(data.benchmark.averageCostPerKg)} / kg
                  </Text>
                  <Text style={styles.benchmarkText}>
                    Votre exploitation est au {data.benchmark.percentile}ème percentile
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  scrollContent: { paddingBottom: 40 },

  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  periodPillActive: { backgroundColor: '#0B4A24', borderColor: '#0B4A24' },
  periodPillText: { fontSize: 13, fontWeight: '600', color: '#555' },
  periodPillTextActive: { color: '#fff' },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryLabel: { fontSize: 11, color: '#888', fontWeight: '500', textTransform: 'uppercase' },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginTop: 4 },

  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiLabel: { fontSize: 11, color: '#888', fontWeight: '500', textTransform: 'uppercase' },
  kpiValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },

  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  detailTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: { fontSize: 13, color: '#1f2937' },
  detailAmount: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  detailTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 4,
  },
  detailTotalLabel: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  detailTotalAmount: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  detailEmpty: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 10 },

  benchmarkCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  benchmarkTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  benchmarkText: { fontSize: 13, color: '#1f2937' },
});