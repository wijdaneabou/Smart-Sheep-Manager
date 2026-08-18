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
import {
  getCashflow,
  getCashflowSummary,
  type FullCashflowData,
  type CashflowSummary,
} from '../../../../services/cashflowService';
import { CASHFLOW_COLORS } from '../../../../constants/finance';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 48;

export default function CashflowScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Redirect if no read permission
  useEffect(() => {
    if (!hasPermission('FINANCE', 'CASHFLOW:READ')) {
      router.replace('/finance');
    }
  }, [hasPermission, router]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FullCashflowData | null>(null);
  const [summary, setSummary] = useState<CashflowSummary | null>(null);

  async function fetchData() {
    setError(null);
    const [cashflowResult, summaryResult] = await Promise.all([
      getCashflow(6),
      getCashflowSummary(),
    ]);

    if (cashflowResult.success && cashflowResult.data) {
      setData(cashflowResult.data);
    } else {
      setError(cashflowResult.message || 'Erreur de chargement du cashflow');
    }

    if (summaryResult.success && summaryResult.data) {
      setSummary(summaryResult.data);
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

  function formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${months[parseInt(month) - 1]} ${year}`;
  }

  function formatCurrency(value: number): string {
    return value.toFixed(2) + ' MAD';
  }

  // Find max value for chart scaling
  const allValues = data?.actual
    ? data.actual.flatMap((m) => [m.inflows, m.outflows, m.balance])
    : [];
  const maxValue = Math.max(...allValues, 1);

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
            <Text style={styles.subtitle}>Suivi des flux financiers</Text>
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
            <View style={[styles.summaryCard, { borderLeftColor: CASHFLOW_COLORS.INFLOW }]}>
              <Text style={styles.summaryLabel}>Entrées</Text>
              <Text style={[styles.summaryValue, { color: CASHFLOW_COLORS.INFLOW }]}>
                {summary ? formatCurrency(summary.currentMonth.inflows) : '0 MAD'}
              </Text>
              <Text style={styles.summaryPeriod}>Ce mois</Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: CASHFLOW_COLORS.OUTFLOW }]}>
              <Text style={styles.summaryLabel}>Sorties</Text>
              <Text style={[styles.summaryValue, { color: CASHFLOW_COLORS.OUTFLOW }]}>
                {summary ? formatCurrency(summary.currentMonth.outflows) : '0 MAD'}
              </Text>
              <Text style={styles.summaryPeriod}>Ce mois</Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: CASHFLOW_COLORS.BALANCE }]}>
              <Text style={styles.summaryLabel}>Solde</Text>
              <Text style={[styles.summaryValue, { color: CASHFLOW_COLORS.BALANCE }]}>
                {summary ? formatCurrency(summary.currentMonth.balance) : '0 MAD'}
              </Text>
              <Text style={styles.summaryPeriod}>Ce mois</Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: CASHFLOW_COLORS.PROJECTION }]}>
              <Text style={styles.summaryLabel}>Cumul annuel</Text>
              <Text style={[styles.summaryValue, { color: CASHFLOW_COLORS.PROJECTION }]}>
                {summary ? formatCurrency(summary.yearToDate.balance) : '0 MAD'}
              </Text>
              <Text style={styles.summaryPeriod}>Depuis janvier</Text>
            </View>
          </View>

          {/* ─── Alert ─── */}
          {summary?.alert && (
            <View style={[styles.alertCard, summary.alert.type === 'danger' ? styles.alertDanger : styles.alertWarning]}>
              <Ionicons name="warning-outline" size={20} color={summary.alert.type === 'danger' ? '#dc2626' : '#f59e0b'} />
              <Text style={styles.alertText}>{summary.alert.message}</Text>
            </View>
          )}

          {/* ─── Chart ─── */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Évolution mensuelle</Text>

            {!data?.actual || data.actual.length === 0 ? (
              <Text style={styles.chartEmpty}>Aucune donnée disponible</Text>
            ) : (
              <View style={styles.chartContainer}>
                {/* Chart bars */}
                <View style={styles.chartBars}>
                  {data.actual.slice(-8).map((item, index) => {
                    const height = Math.max((Math.abs(item.balance) / maxValue) * 120, 8);
                    const isPositive = item.balance >= 0;

                    return (
                      <View key={index} style={styles.barGroup}>
                        <View style={styles.barWrapper}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height,
                                backgroundColor: isPositive ? CASHFLOW_COLORS.INFLOW : CASHFLOW_COLORS.OUTFLOW,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel}>{formatMonth(item.month).split(' ')[0]}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Cumulative line */}
                <View style={styles.cumulativeContainer}>
                  <Text style={styles.cumulativeLabel}>Cumulé</Text>
                  <View style={styles.cumulativeLine}>
                    {data.actual.slice(-8).map((item, index) => {
                      const y = Math.max(0, (item.cumulative / maxValue) * 60);
                      return (
                        <View key={index} style={[styles.cumulativePoint, { bottom: y + 10 }]} />
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* ─── Projection ─── */}
          {data?.projection && data.projection.length > 0 && (
            <View style={styles.projectionCard}>
              <Text style={styles.projectionTitle}>Projection</Text>
              <Text style={styles.projectionSubtitle}>Prévision sur {data.projection.length} mois</Text>

              <View style={styles.projectionGrid}>
                {data.projection.map((item, index) => (
                  <View key={index} style={styles.projectionItem}>
                    <Text style={styles.projectionMonth}>{formatMonth(item.month)}</Text>
                    <Text style={[styles.projectionBalance, { color: item.projectedBalance >= 0 ? '#16a34a' : '#dc2626' }]}>
                      {item.projectedBalance >= 0 ? '+' : ''}{formatCurrency(item.projectedBalance)}
                    </Text>
                    <Text style={styles.projectionDetails}>
                      Entrées: {formatCurrency(item.projectedInflows)} · Sorties: {formatCurrency(item.projectedOutflows)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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
  summaryPeriod: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },

  // Alert
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  alertWarning: { borderColor: '#f59e0b' },
  alertDanger: { borderColor: '#dc2626' },
  alertText: {
    fontSize: 13,
    color: '#1f2937',
    flex: 1,
  },

  // Chart
  chartCard: {
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
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  chartEmpty: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 30,
  },
  chartContainer: {
    position: 'relative',
    paddingVertical: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
  },
  barGroup: {
    alignItems: 'center',
    width: 32,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 22,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    color: '#888',
    marginTop: 4,
  },
  cumulativeContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cumulativeLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  cumulativeLine: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 70,
    paddingHorizontal: 4,
    position: 'relative',
  },
  cumulativePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CASHFLOW_COLORS.BALANCE,
  },

  // Projection
  projectionCard: {
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
  projectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  projectionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 12,
  },
  projectionGrid: {
    gap: 10,
  },
  projectionItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  projectionMonth: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  projectionBalance: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  projectionDetails: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
});