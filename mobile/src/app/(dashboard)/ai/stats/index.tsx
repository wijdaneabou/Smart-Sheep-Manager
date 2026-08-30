// mobile/src/app/(dashboard)/ai/stats/index.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePredictionStore } from '../../../../stores/predictionStore';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import api from '../../../../services/api';
import Scatter3D from '../../../../components/Scatter3D';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle, G } from 'react-native-svg';

const COLORS = {
  primary: '#0F7A3C',
  background: '#F5F8FA',
  white: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#666666',
  high: '#8B0000',
  moderate: '#888888',
  low: '#4CAF50',
  border: '#E8E8E8',
};

type RiskFr = 'Élevé' | 'Modéré' | 'Faible';

const riskColor = (r: RiskFr | string) =>
  r === 'Élevé' ? COLORS.high : r === 'Modéré' ? COLORS.moderate : COLORS.low;

const { width: screenWidth } = Dimensions.get('window');
const H_PADDING = 16;
const contentWidth = screenWidth - H_PADDING * 2;

// ============================================================
// ANIMATED DONUT (2D)
// ============================================================

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function DonutChart({
  segments,
  size = 160,
  strokeWidth = 22,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  let offsetAcc = 0;

  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EEF2F5"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {segments.map((seg, i) => {
          const fraction = seg.value / total;
          const segLen = fraction * circumference;
          const gap = 3;
          const dashArray = [Math.max(segLen - gap, 0), circumference];
          const rotationOffset = (offsetAcc / total) * circumference;
          offsetAcc += seg.value;

          const animatedOffset = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [circumference, -rotationOffset],
          });

          return (
            <AnimatedCircle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={dashArray as unknown as string}
              strokeDashoffset={animatedOffset}
            />
          );
        })}
      </G>
    </Svg>
  );
}

// ============================================================
// SPARKLINE (mini probability bar)
// ============================================================

function ProbabilityBar({ value, color }: { value: number; color: string }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, {
      toValue: value,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);
  return (
    <View style={styles.probTrack}>
      <Animated.View
        style={[
          styles.probFill,
          {
            backgroundColor: color,
            width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

// ============================================================
// SCREEN
// ============================================================

export default function StatsScreen() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const {
    statistics,
    allAnimals,
    isLoading,
    fetchStatistics,
    fetchAllAnimals,
  } = usePredictionStore();

  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const canViewStats = permissions.includes('AI:STATISTICS');

  // entrance animation
  const enter = useRef(new Animated.Value(0)).current;

  // Fetch real trend data
  const fetchTrend = async () => {
    try {
      const response = await api.get('/predictions/trend');
      setTrendData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch trend:', error);
    }
  };

  useEffect(() => {
    if (canViewStats) {
      fetchStatistics();
      fetchAllAnimals(100);
      fetchTrend();
    }
  }, [canViewStats]);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStatistics(), fetchAllAnimals(100), fetchTrend()]);
    setRefreshing(false);
  };

  // ---- Data ----
  const high = statistics?.highRisk || 0;
  const moderate = statistics?.moderateRisk || 0;
  const low = statistics?.lowRisk || 0;
  const total = statistics?.totalPredictions || 0;

  const segments = [
    { value: high, color: COLORS.high },
    { value: moderate, color: COLORS.moderate },
    { value: low, color: COLORS.low },
  ].filter(s => s.value > 0);

  const hasData = total > 0;

  // ---- Real Trend Data for Chart ----
  const trendChartData = {
    labels: trendData.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    }),
    datasets: [
      {
        data: trendData.map(d => d.count),
        color: (o = 1) => `rgba(15, 122, 60, ${o})`,
        strokeWidth: 2,
      },
    ],
  };

  // ---- 3D Scatter Data – Use fallbacks for missing BCS / Temp / Weight ----
  const scatter3DData = useMemo(() => {
    return allAnimals.map((a) => {
      // Fallback chain: current real-time → featureValues → defaults
      const temp = a.currentTemperature ?? a.featureValues?.temp_last ?? 38.5;
      const bcs = a.currentBcs ?? a.featureValues?.bcs_last ?? 2.5;
      const weight = a.animalWeight ?? a.featureValues?.weight_last ?? 40;

      return {
        id: a.animalId.toString(),
        x: temp,
        y: bcs,
        z: weight,
        color: riskColor(a.riskLevel as RiskFr),
        name: a.animalName || `#${a.animalId}`,
        rfid: a.animalRfid || 'N/A',
        risk: a.riskLevel as RiskFr,
        hasData: !!(a.currentTemperature || a.featureValues?.temp_last || a.currentBcs || a.featureValues?.bcs_last),
      };
    });
  }, [allAnimals]);

  // ---- Table data ----
  const tableData = useMemo(() => {
    const order: Record<RiskFr, number> = { Élevé: 0, Modéré: 1, Faible: 2 };
    return [...allAnimals].sort((a, b) => order[a.riskLevel as RiskFr] - order[b.riskLevel as RiskFr]);
  }, [allAnimals]);

  const highCount = scatter3DData.filter(p => p.risk === 'Élevé').length;

  if (!canViewStats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.deniedContainer}>
          <Feather name="lock" size={56} color="#999" />
          <Text style={styles.deniedTitle}>Accès refusé</Text>
          <Text style={styles.deniedText}>
            Vous n'avez pas la permission de voir les statistiques.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading && !statistics && !allAnimals.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Plain Header */}
        <View style={styles.headerPlain}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitlePlain}>Statistiques</Text>
          <View style={{ width: 24 }} />
        </View>

        <Animated.View style={{ opacity: enter, transform: [{ translateY }] }}>
          {/* Donut */}
          <View style={[styles.card, styles.shadow3d]}>
            <Text style={styles.cardTitle}>Répartition des Risques</Text>
            {hasData ? (
              <View style={styles.donutRow}>
                <View style={styles.donutWrap}>
                  <DonutChart segments={segments} size={160} strokeWidth={22} />
                  <View style={styles.donutCenter}>
                    <Text style={styles.donutPct}>{total > 0 ? Math.round((high / total) * 100) : 0}%</Text>
                    <Text style={styles.donutCenterLabel}>Élevé</Text>
                  </View>
                </View>

                <View style={styles.legend}>
                  {[
                    { label: 'Élevé', value: high, color: COLORS.high },
                    { label: 'Modéré', value: moderate, color: COLORS.moderate },
                    { label: 'Faible', value: low, color: COLORS.low },
                  ].map((l) => (
                    <View key={l.label} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                      <Text style={styles.legendLabel}>{l.label}</Text>
                      <Text style={styles.legendValue}>{l.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.noDataText}>Aucune prédiction disponible</Text>
            )}
          </View>

          {/* Trend Line */}
          <View style={[styles.card, styles.shadow3d]}>
            <Text style={styles.cardTitle}>Tendance (7 jours)</Text>
            {trendData.length > 0 ? (
              <LineChart
                data={trendChartData}
                width={contentWidth - 8}
                height={170}
                withInnerLines
                withOuterLines={false}
                withVerticalLines={false}
                fromZero
                bezier
                chartConfig={{
                  backgroundGradientFrom: COLORS.white,
                  backgroundGradientTo: COLORS.white,
                  decimalPlaces: 0,
                  color: (o = 1) => `rgba(15, 122, 60, ${o})`,
                  labelColor: () => COLORS.textSecondary,
                  fillShadowGradient: COLORS.primary,
                  fillShadowGradientOpacity: 0.15,
                  propsForBackgroundLines: { stroke: '#EEF2F5' },
                  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary, fill: COLORS.white },
                }}
                style={styles.lineChart}
              />
            ) : (
              <Text style={styles.noDataText}>Aucune donnée de tendance</Text>
            )}
          </View>

          {/* 3D Scatter Plot */}
          <View style={[styles.card, styles.shadow3d]}>
            <Text style={styles.cardTitle}>Température vs BCS vs Poids (3D)</Text>
            {scatter3DData.length > 0 ? (
              <>
                <Scatter3D
                  points={scatter3DData}
                  width={contentWidth - 20}
                  height={220}
                  onPointPress={(point) => {
                    console.log('Pressed:', point);
                  }}
                />
                <Text style={styles.scatterHint}>
                  {highCount} à risque élevé • Glisser pour pivoter • Toucher pour détails
                  {'\n'}Les points avec données manquantes utilisent des valeurs par défaut.
                </Text>
              </>
            ) : (
              <Text style={styles.noDataText}>Aucun animal disponible</Text>
            )}
          </View>

          {/* Table */}
          <View style={[styles.card, styles.shadow3d]}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.cardTitle}>Aperçu</Text>
              <Text style={styles.tableCount}>{tableData.length}</Text>
            </View>

            <View style={styles.colHead}>
              <Text style={[styles.colHeadText, { flex: 1.4 }]}>Animal</Text>
              <Text style={[styles.colHeadText, { flex: 1, textAlign: 'center' }]}>Risque</Text>
              <Text style={[styles.colHeadText, { flex: 1.3 }]}>Probabilité</Text>
              <Text style={[styles.colHeadText, { width: 48, textAlign: 'right' }]}>Poids</Text>
            </View>

            {tableData.length > 0 ? (
              tableData.slice(0, 15).map((item, idx) => {
                const c = riskColor(item.riskLevel as RiskFr);
                return (
                  <View
                    key={item.animalId}
                    style={[styles.row, idx % 2 === 1 && { backgroundColor: '#FAFBFC' }]}
                  >
                    <View style={{ flex: 1.4 }}>
                      <Text style={styles.rowName}>{item.animalName || `#${item.animalId}`}</Text>
                      <Text style={styles.rowRfid}>{item.animalRfid || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <View style={[styles.badge, { backgroundColor: `${c}15` }]}>
                        <View style={[styles.badgeDot, { backgroundColor: c }]} />
                        <Text style={[styles.badgeText, { color: c }]}>{item.riskLevel}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1.3, paddingRight: 8 }}>
                      <Text style={styles.rowProbText}>{(item.probability * 100).toFixed(0)}%</Text>
                      <ProbabilityBar value={item.probability} color={c} />
                    </View>
                    <Text style={[styles.rowWeight, { width: 48 }]}>
                      {item.animalWeight || '—'} kg
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDataText}>Aucun animal avec prédiction</Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES (unchanged)
// ============================================================

const CARD_SHADOW = {
  shadowColor: '#0A2540',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 30 },

  headerPlain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
  },
  backBtn: { padding: 4 },
  headerTitlePlain: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: H_PADDING,
    marginBottom: 12,
    ...CARD_SHADOW,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },

  donutRow: { flexDirection: 'row', alignItems: 'center' },
  donutWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutPct: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  donutCenterLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  legend: { flex: 1, paddingLeft: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  legendValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },

  lineChart: { marginLeft: -8, borderRadius: 10 },

  scatterHint: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 4, textAlign: 'center' },

  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  tableCount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: `${COLORS.primary}12`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  colHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  colHeadText: { fontSize: 10, fontWeight: '700', color: '#9AA5B1', textTransform: 'uppercase', letterSpacing: 0.3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  rowName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  rowRfid: { fontSize: 10, color: '#9AA5B1', marginTop: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeDot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  rowProbText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  probTrack: { height: 4, borderRadius: 2, backgroundColor: '#EEF2F5', overflow: 'hidden' },
  probFill: { height: 4, borderRadius: 2 },
  rowWeight: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', fontWeight: '600' },

  noDataText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingVertical: 14,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
  },
  deniedText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow3d: CARD_SHADOW,
});