import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../../../../components/BackButton';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { getProfitabilitySummary, type ProfitabilitySummary } from '../../../../services/profitabilityService';
import { CATEGORY_COLORS, REVENUE_TYPE_COLORS } from '../../../../constants/finance';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 70;

export default function ProfitabilityScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Redirect if no read permission
  useEffect(() => {
    if (!hasPermission('FINANCE', 'PROFITABILITY:READ')) {
      router.replace('/finance');
    }
  }, [hasPermission, router]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProfitabilitySummary | null>(null);

  async function fetchData() {
    setError(null);
    const endDate = new Date().toISOString();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    const result = await getProfitabilitySummary(startDate.toISOString(), endDate);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.message || 'Erreur de chargement de la rentabilité');
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  function formatCurrency(value: number): string {
    return value.toFixed(2) + ' MAD';
  }

  // Find max value for chart scaling
  const allValues = data
    ? [...Object.values(data.costsByCategory), ...Object.values(data.revenuesByType)]
    : [];
  const maxValue = Math.max(...allValues, 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <BackButton variant="dark" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Rentabilité</Text>
            <Text style={styles.subtitle}>
              {data?.period
                ? `Du ${new Date(data.period.startDate).toLocaleDateString('fr-FR')} au ${new Date(data.period.endDate).toLocaleDateString('fr-FR')}`
                : ''}
            </Text>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Summary Cards ─── */}
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { borderLeftColor: '#16a34a' }]}>
              <Text style={styles.summaryLabel}>Revenus totaux</Text>
              <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
                {data ? formatCurrency(data.totalRevenues) : '0 MAD'}
              </Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: '#dc2626' }]}>
              <Text style={styles.summaryLabel}>Coûts totaux</Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                {data ? formatCurrency(data.totalCosts) : '0 MAD'}
              </Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: '#2563eb' }]}>
              <Text style={styles.summaryLabel}>Marge brute</Text>
              <Text style={[styles.summaryValue, { color: '#2563eb' }]}>
                {data ? formatCurrency(data.grossMargin) : '0 MAD'}
              </Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: '#7c3aed' }]}>
              <Text style={styles.summaryLabel}>Marge nette</Text>
              <Text style={[styles.summaryValue, { color: '#7c3aed' }]}>
                {data ? formatCurrency(data.netMargin) : '0 MAD'}
              </Text>
            </View>
          </View>

          {/* ─── Breakdown: Costs by Category ─── */}
          {data && Object.keys(data.costsByCategory).length > 0 && (
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Coûts par catégorie</Text>
              {Object.entries(data.costsByCategory).map(([category, amount]) => {
                const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6b7280';
                const percentage = maxValue > 0 ? (amount / maxValue) * 100 : 0;
                return (
                  <View key={category} style={styles.barRow}>
                    <Text style={styles.barLabel}>{category}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.barAmount}>{formatCurrency(amount)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ─── Breakdown: Revenues by Type ─── */}
          {data && Object.keys(data.revenuesByType).length > 0 && (
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Revenus par type</Text>
              {Object.entries(data.revenuesByType).map(([type, amount]) => {
                const color = REVENUE_TYPE_COLORS[type as keyof typeof REVENUE_TYPE_COLORS] || '#6b7280';
                const percentage = maxValue > 0 ? (amount / maxValue) * 100 : 0;
                return (
                  <View key={type} style={styles.barRow}>
                    <Text style={styles.barLabel}>{type}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.barAmount}>{formatCurrency(amount)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {data &&
            Object.keys(data.costsByCategory).length === 0 &&
            Object.keys(data.revenuesByType).length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Aucune donnée de rentabilité</Text>
                <Text style={styles.emptySubtext}>
                  Enregistrez des dépenses et des revenus pour voir votre rentabilité.
                </Text>
              </View>
            )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  backButton: { marginRight: 8 },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },

  error: { color: '#dc2626', marginBottom: 8, fontSize: 13 },
  scrollContent: { paddingBottom: 40 },

  // Summary Cards
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
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
  summaryLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },

  // Breakdown
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  barLabel: {
    width: 70,
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barAmount: {
    width: 80,
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'right',
  },

  // Empty
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 4 },
});