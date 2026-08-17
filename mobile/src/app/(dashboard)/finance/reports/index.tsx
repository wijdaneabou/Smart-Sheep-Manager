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
import { getPnLReport, exportPnL, generatePdfReport, type PnLReport } from '../../../../services/reportService';
import { CATEGORY_COLORS, REVENUE_TYPE_COLORS } from '../../../../constants/finance';
// ✅ Use the /legacy import for FileSystem
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';

export default function ReportsScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (!hasPermission('FINANCE', 'REPORT:READ')) {
      router.replace('/finance');
    }
  }, [hasPermission, router]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PnLReport | null>(null);

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

  const fetchReport = useCallback(async () => {
    setError(null);
    const { start, end } = getDefaultPeriod();
    setStartDate(start);
    setEndDate(end);
    const result = await getPnLReport(start, end);
    if (result.success && result.data) {
      setReport(result.data);
    } else {
      setError(result.message || 'Erreur de chargement');
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchReport().finally(() => setLoading(false));
    }, [fetchReport])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchReport();
    setRefreshing(false);
  }

  // ─── Export handlers ──────────────────────────────────────────────────

  async function saveAndShareFile(content: string, format: 'csv' | 'fec') {
    try {
      const fileName = `rapport_${format}_${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le fichier.');
      console.error(err);
    }
  }

  async function handleExportCSV() {
    if (!startDate || !endDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner une période.');
      return;
    }
    const result = await exportPnL(startDate, endDate, 'csv');
    if (result.success && result.data) {
      await saveAndShareFile(result.data, 'csv');
    } else {
      Alert.alert('Erreur', result.message || 'Échec de l\'export CSV');
    }
  }

  async function handleExportFEC() {
    if (!startDate || !endDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner une période.');
      return;
    }
    const result = await exportPnL(startDate, endDate, 'fec');
    if (result.success && result.data) {
      await saveAndShareFile(result.data, 'fec');
    } else {
      Alert.alert('Erreur', result.message || 'Échec de l\'export FEC');
    }
  }

  async function handleExportPDF() {
    if (!report) {
      Alert.alert('Erreur', 'Aucun rapport à exporter.');
      return;
    }
    const result = await generatePdfReport(report);
    if (result.success) {
      Alert.alert('Succès', 'PDF généré et partagé.');
    } else {
      Alert.alert('Erreur', result.message || 'Échec de la génération du PDF');
    }
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
            <Text style={styles.title}>Rapports financiers</Text>
            <Text style={styles.subtitle}>Compte de résultat</Text>
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

          {report && (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Période</Text>
                <Text style={styles.summaryValue}>
                  {new Date(report.period.startDate).toLocaleDateString('fr-FR')} – {new Date(report.period.endDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>

              <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { borderLeftColor: '#16a34a' }]}>
                  <Text style={styles.kpiLabel}>Revenus</Text>
                  <Text style={[styles.kpiValue, { color: '#16a34a' }]}>
                    {formatCurrency(report.totalRevenues)}
                  </Text>
                </View>
                <View style={[styles.kpiCard, { borderLeftColor: '#dc2626' }]}>
                  <Text style={styles.kpiLabel}>Dépenses</Text>
                  <Text style={[styles.kpiValue, { color: '#dc2626' }]}>
                    {formatCurrency(report.totalExpenses)}
                  </Text>
                </View>
                <View style={[styles.kpiCard, { borderLeftColor: '#2563eb' }]}>
                  <Text style={styles.kpiLabel}>Résultat net</Text>
                  <Text style={[styles.kpiValue, { color: report.netProfit >= 0 ? '#16a34a' : '#dc2626' }]}>
                    {formatCurrency(report.netProfit)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>Détail des revenus</Text>
                {report.revenues.length === 0 ? (
                  <Text style={styles.detailEmpty}>Aucun revenu</Text>
                ) : (
                  report.revenues.map((r, i) => (
                    <View key={i} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{r.category}</Text>
                      <Text style={styles.detailAmount}>{formatCurrency(r.total)}</Text>
                    </View>
                  ))
                )}
                <View style={styles.detailTotal}>
                  <Text style={styles.detailTotalLabel}>Total</Text>
                  <Text style={styles.detailTotalAmount}>{formatCurrency(report.totalRevenues)}</Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>Détail des dépenses</Text>
                {report.expenses.length === 0 ? (
                  <Text style={styles.detailEmpty}>Aucune dépense</Text>
                ) : (
                  report.expenses.map((e, i) => (
                    <View key={i} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{e.category}</Text>
                      <Text style={styles.detailAmount}>{formatCurrency(e.total)}</Text>
                    </View>
                  ))
                )}
                <View style={styles.detailTotal}>
                  <Text style={styles.detailTotalLabel}>Total</Text>
                  <Text style={styles.detailTotalAmount}>{formatCurrency(report.totalExpenses)}</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.exportRow}>
            <Pressable style={styles.exportButton} onPress={handleExportCSV}>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.exportButtonText}>CSV</Text>
            </Pressable>
            <Pressable style={[styles.exportButton, styles.exportButtonFEC]} onPress={handleExportFEC}>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.exportButtonText}>FEC</Text>
            </Pressable>
            <Pressable style={[styles.exportButton, styles.exportButtonPDF]} onPress={handleExportPDF}>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.exportButtonText}>PDF</Text>
            </Pressable>
          </View>
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

  exportRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B4A24',
    borderRadius: 10,
    paddingVertical: 14,
  },
  exportButtonFEC: { backgroundColor: '#7c3aed' },
  exportButtonPDF: { backgroundColor: '#dc2626' },
  exportButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});