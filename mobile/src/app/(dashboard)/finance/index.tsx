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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listBudgets, deleteBudget, type Budget } from '../../../services/budgetService';
import { listExpenses, deleteExpense, type Expense } from '../../../services/expenseService';
import { listRevenues, deleteRevenue, type Revenue } from '../../../services/revenueService';
import { BackButton } from '../../../components/BackButton';
import { usePermissions } from '../../../contexts/PermissionsContext';
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  PAYMENT_METHOD_LABELS,
  REVENUE_TYPE_LABELS,
  REVENUE_TYPE_COLORS,
  REVENUE_STATUS_LABELS,
  REVENUE_STATUS_COLORS,
} from '../../../constants/finance';

// Import sub-screens to render inline
import CashflowScreen from './cashflow/index';
import ProfitabilityScreen from './profitability/index';
import ReportsScreen from './reports/index';
import CostScreen from './cost/index';

type Tab = 'budgets' | 'expenses' | 'revenues' | 'cashflow' | 'profitability' | 'reports' | 'cost';

export default function FinanceDashboardScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [selectedTab, setSelectedTab] = useState<Tab>('budgets');

  const canReadBudgets = hasPermission('FINANCE', 'BUDGET:READ');
  const canReadExpenses = hasPermission('FINANCE', 'EXPENSE:READ');
  const canReadRevenues = hasPermission('FINANCE', 'REVENUE:READ');
  const canReadCashflow = hasPermission('FINANCE', 'CASHFLOW:READ');
  const canReadProfitability = hasPermission('FINANCE', 'PROFITABILITY:READ');
  const canReadReports = hasPermission('FINANCE', 'REPORT:READ');
  const canReadCost = hasPermission('FINANCE', 'COST:READ');

  // Redirect if user has no finance access at all
  useEffect(() => {
    const hasAnyAccess = canReadBudgets || canReadExpenses || canReadRevenues || canReadCashflow || canReadProfitability || canReadReports || canReadCost;
    if (!hasAnyAccess) {
      router.replace('/(dashboard)');
    } else {
      // If current tab is not allowed, switch to first allowed
      const tabs: Tab[] = ['budgets', 'expenses', 'revenues', 'cashflow', 'profitability', 'reports', 'cost'];
      const allowedTabs = tabs.filter(tab => {
        switch (tab) {
          case 'budgets': return canReadBudgets;
          case 'expenses': return canReadExpenses;
          case 'revenues': return canReadRevenues;
          case 'cashflow': return canReadCashflow;
          case 'profitability': return canReadProfitability;
          case 'reports': return canReadReports;
          case 'cost': return canReadCost;
          default: return false;
        }
      });
      if (!allowedTabs.includes(selectedTab)) {
        setSelectedTab(allowedTabs[0] || 'budgets');
      }
    }
  }, [canReadBudgets, canReadExpenses, canReadRevenues, canReadCashflow, canReadProfitability, canReadReports, canReadCost, router, selectedTab]);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreateBudget = hasPermission('FINANCE', 'BUDGET:CREATE');
  const canCreateExpense = hasPermission('FINANCE', 'EXPENSE:CREATE');
  const canCreateRevenue = hasPermission('FINANCE', 'REVENUE:CREATE');

  async function fetchBudgets() {
    const result = await listBudgets();
    if (result.success) {
      setBudgets(result.data);
    } else {
      setError(result.message || 'Erreur de chargement des budgets');
    }
  }

  async function fetchExpenses() {
    const result = await listExpenses();
    if (result.success) {
      setExpenses(result.data);
    } else {
      setError(result.message || 'Erreur de chargement des dépenses');
    }
  }

  async function fetchRevenues() {
    const result = await listRevenues();
    if (result.success) {
      setRevenues(result.data);
    } else {
      setError(result.message || 'Erreur de chargement des revenus');
    }
  }

  async function fetchData() {
    setError(null);
    if (selectedTab === 'budgets' && canReadBudgets) {
      await fetchBudgets();
    } else if (selectedTab === 'expenses' && canReadExpenses) {
      await fetchExpenses();
    } else if (selectedTab === 'revenues' && canReadRevenues) {
      await fetchRevenues();
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (selectedTab === 'budgets' || selectedTab === 'expenses' || selectedTab === 'revenues') {
        setLoading(true);
        fetchData().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }, [selectedTab])
  );

  async function onRefresh() {
    if (selectedTab === 'budgets' || selectedTab === 'expenses' || selectedTab === 'revenues') {
      setRefreshing(true);
      await fetchData();
      setRefreshing(false);
    }
  }

  // --- Delete handlers ---
  async function handleDeleteBudget(id: number) {
    Alert.alert('Confirmer la suppression', 'Supprimer ce budget ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteBudget(id);
          if (result.success) {
            setBudgets((prev) => prev.filter((b) => b.id !== id));
          } else {
            Alert.alert('Erreur', result.message || 'Échec de la suppression');
          }
        },
      },
    ]);
  }

  async function handleDeleteExpense(id: number) {
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

  async function handleDeleteRevenue(id: number) {
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

  // ─── Render Budget Item ──────────────────────────────────────────────
  const renderBudgetItem = ({ item }: { item: Budget }) => {
    const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
    const color = CATEGORY_COLORS[item.category] || '#6b7280';
    const planned = parseFloat(item.plannedAmount);
    const actual = parseFloat(item.actualAmount);
    const variance = planned - actual;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.categoryBadge}>
            <View style={[styles.categoryDot, { backgroundColor: color }]} />
            <Text style={styles.categoryLabel}>{categoryLabel}</Text>
          </View>
          <Text style={styles.yearText}>
            {item.year}{item.month ? ` · Mois ${item.month}` : ''}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>Prévu</Text>
            <Text style={styles.amountValue}>{planned.toFixed(2)} MAD</Text>
          </View>
          <View>
            <Text style={styles.amountLabel}>Réel</Text>
            <Text style={styles.amountValue}>{actual.toFixed(2)} MAD</Text>
          </View>
          <View>
            <Text style={styles.amountLabel}>Écart</Text>
            <Text
              style={[
                styles.amountValue,
                { color: variance >= 0 ? '#16a34a' : '#dc2626' },
              ]}
            >
              {variance.toFixed(2)} MAD
            </Text>
          </View>
        </View>

        {item.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            {item.notes}
          </Text>
        )}

        <View style={styles.cardActions}>
          {hasPermission('FINANCE', 'BUDGET:UPDATE') && (
            <Pressable
              style={styles.actionButton}
              onPress={() =>
                router.push({
                  pathname: '/finance/budget/create',
                  params: { id: String(item.id) },
                } as any)
              }
            >
              <Ionicons name="create-outline" size={16} color="#14532d" />
            </Pressable>
          )}
          {hasPermission('FINANCE', 'BUDGET:DELETE') && (
            <Pressable
              style={[styles.actionButton, styles.actionDelete]}
              onPress={() => handleDeleteBudget(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#dc2626" />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // ─── Render Expense Item ──────────────────────────────────────────────
  const renderExpenseItem = ({ item }: { item: Expense }) => {
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
              onPress={() => handleDeleteExpense(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#dc2626" />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // ─── Render Revenue Item ──────────────────────────────────────────────
  const renderRevenueItem = ({ item }: { item: Revenue }) => {
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
              onPress={() => handleDeleteRevenue(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#dc2626" />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // ─── Empty state (fully typed) ──────────────────────────────────────
  const renderEmptyState = (tab: Tab) => {
    const config: Record<Tab, { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }> = {
      budgets: { icon: 'cash-outline', title: 'Aucun budget enregistré', desc: 'Créez un budget pour suivre vos prévisions financières.' },
      expenses: { icon: 'receipt-outline', title: 'Aucune dépense enregistrée', desc: 'Ajoutez vos dépenses pour suivre votre trésorerie.' },
      revenues: { icon: 'trending-up-outline', title: 'Aucun revenu enregistré', desc: 'Ajoutez vos ventes pour suivre votre chiffre d\'affaires.' },
      cashflow: { icon: 'cash-outline', title: 'Aucune donnée de trésorerie', desc: 'Les données apparaîtront ici lorsque vous aurez des revenus et des dépenses.' },
      profitability: { icon: 'bar-chart-outline', title: 'Aucune donnée de rentabilité', desc: 'Enregistrez des dépenses et des revenus pour voir votre rentabilité.' },
      reports: { icon: 'document-text-outline', title: 'Aucun rapport disponible', desc: 'Générez un rapport pour la période sélectionnée.' },
      cost: { icon: 'calculator-outline', title: 'Aucune donnée de coût', desc: 'Enregistrez des dépenses et des poids pour calculer le coût de production.' },
    };
    const c = config[tab];
    return (
      <View style={styles.emptyState}>
        <Ionicons name={c.icon} size={48} color="#ccc" />
        <Text style={styles.emptyText}>{c.title}</Text>
        <Text style={styles.emptySubtext}>{c.desc}</Text>
      </View>
    );
  };

  // ─── Render content based on selected tab ──────────────────────────
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator style={{ marginTop: 24 }} />;
    }

    switch (selectedTab) {
      case 'budgets':
        return (
          <FlatList
            data={budgets}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyState('budgets')}
            renderItem={renderBudgetItem}
          />
        );
      case 'expenses':
        return (
          <FlatList
            data={expenses}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyState('expenses')}
            renderItem={renderExpenseItem}
          />
        );
      case 'revenues':
        return (
          <FlatList
            data={revenues}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyState('revenues')}
            renderItem={renderRevenueItem}
          />
        );
      case 'cashflow':
        return <CashflowScreen />;
      case 'profitability':
        return <ProfitabilityScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'cost':
        return <CostScreen />;
      default:
        return null;
    }
  };

  // ─── Tab bar ──────────────────────────────────────────────────────────
  const showTab = (tab: Tab) => {
    switch (tab) {
      case 'budgets': return canReadBudgets;
      case 'expenses': return canReadExpenses;
      case 'revenues': return canReadRevenues;
      case 'cashflow': return canReadCashflow;
      case 'profitability': return canReadProfitability;
      case 'reports': return canReadReports;
      case 'cost': return canReadCost;
      default: return false;
    }
  };

  const tabs: Tab[] = ['budgets', 'expenses', 'revenues', 'cashflow', 'profitability', 'reports', 'cost'];
  const visibleTabs = tabs.filter(showTab);

  const handleTabPress = (tab: Tab) => {
    setSelectedTab(tab);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Top row: Back button + Tabs (Scrollable horizontally) */}
        <View style={styles.topRow}>
          <BackButton variant="dark" style={styles.backButton} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {visibleTabs.map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, selectedTab === tab && styles.tabActive]}
                onPress={() => handleTabPress(tab)}
              >
                <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                  {tab === 'budgets' ? 'Budgets' :
                   tab === 'expenses' ? 'Dépenses' :
                   tab === 'revenues' ? 'Revenus' :
                   tab === 'cashflow' ? 'Trésorerie' :
                   tab === 'profitability' ? 'Rentabilité' :
                   tab === 'reports' ? 'Rapports' :
                   tab === 'cost' ? 'Coût' : tab}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Content area */}
        <View style={styles.content}>
          {renderContent()}
        </View>

        {/* FAB - conditional based on selected tab and permissions */}
        {(selectedTab === 'budgets' && canCreateBudget) ||
        (selectedTab === 'expenses' && canCreateExpense) ||
        (selectedTab === 'revenues' && canCreateRevenue) ? (
          <Pressable
            style={styles.fab}
            onPress={() => {
              let path = '';
              if (selectedTab === 'budgets') path = '/finance/budget/create';
              else if (selectedTab === 'expenses') path = '/finance/expenses/create';
              else if (selectedTab === 'revenues') path = '/finance/revenues/create';
              router.push({
                pathname: path,
                params: {},
              } as any);
            }}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, paddingHorizontal: 16 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  backButton: {
    marginRight: 4,
    paddingHorizontal: 4,
  },
  tabsContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#0B4A24',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#fff',
  },

  error: { color: '#dc2626', marginBottom: 8, fontSize: 13 },
  content: { flex: 1 },
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
  yearText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  amountLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
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
  buyer: {
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