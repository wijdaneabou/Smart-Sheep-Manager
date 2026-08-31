import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";

const SCREEN_WIDTH = Dimensions.get("window").width;

const COLORS = {
  primary: "#2E7D32",
  primaryLight: "#E8F5E9",
  primaryDark: "#1B5E20",
  danger: "#C62828",
  dangerLight: "#FFEBEE",
  warning: "#F9A825",
  warningLight: "#FFFDE7",
  info: "#1565C0",
  infoLight: "#E3F2FD",
  purple: "#6D28D9",
  purpleLight: "#F3E8FF",
  background: "#F8FAF9",
  card: "#FFFFFF",
  text: "#1B1B1B",
  textSecondary: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  shadow: "rgba(15, 23, 42, 0.06)",
  shadowMedium: "rgba(15, 23, 42, 0.10)",
};

const chartConfig = {
  backgroundGradientFrom: COLORS.card,
  backgroundGradientTo: COLORS.card,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  propsForDots: { r: "5", strokeWidth: "2.5", stroke: COLORS.primary },
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: COLORS.border,
    strokeWidth: 1,
  },
  fillShadowGraph: false,
};

export function KpiHerdWidget({ dashboard }: { dashboard: any }) {
  return (
    <View style={styles.kpiRow}>
      <KpiCard
        label="Effectif total"
        value={String(dashboard?.herd.totalAnimals ?? 0)}
        accentColor={COLORS.primary}
        icon="people-outline"
        trend={null}
      />
      <KpiCard
        label="BCS moyen"
        value={dashboard?.herd.avgBcs != null ? dashboard.herd.avgBcs.toFixed(1) : "—"}
        accentColor={COLORS.info}
        icon="heart-outline"
        trend={null}
      />
      <KpiCard
        label="Mortalité"
        value={`${dashboard?.mortalityRate ?? 0}%`}
        accentColor={(dashboard && dashboard.mortalityRate > 5) ? COLORS.danger : COLORS.textSecondary}
        icon="alert-circle-outline"
        trend={(dashboard && dashboard.mortalityRate > 5) ? "up" : "down"}
      />
      <KpiCard
        label="Fertilité"
        value={`${dashboard?.fertilityRate ?? 0}%`}
        accentColor={COLORS.primary}
        icon="checkmark-circle-outline"
        trend="up"
      />
    </View>
  );
}

export function KpiGmqWidget({ dashboard }: { dashboard: any }) {
  const point = dashboard?.gmqTrend?.[dashboard.gmqTrend.length - 1];
  return (
    <View style={styles.kpiRow}>
      <KpiCard
        label="GMQ dernier mois"
        value={point?.gmqGramsPerDay != null ? `${point.gmqGramsPerDay} g/j` : "—"}
        accentColor={COLORS.primary}
        icon="trending-up-outline"
        trend={point?.gmqGramsPerDay && point.gmqGramsPerDay > 200 ? "up" : "neutral"}
      />
      <KpiCard
        label="Poids moyen"
        value={point?.avgWeight != null ? `${point.avgWeight.toFixed(1)} kg` : "—"}
        accentColor={COLORS.textSecondary}
        icon="barbell-outline"
        trend={point?.avgWeight && point.avgWeight > 40 ? "up" : "neutral"}
      />
    </View>
  );
}

export function KpiFcrWidget() {
  return (
    <View style={styles.kpiRow}>
      <KpiCard
        label="FCR"
        value="1.8"
        accentColor={COLORS.info}
        icon="analytics-outline"
        trend="down"
      />
      <KpiCard
        label="Conso aliment"
        value="2.4 kg/j"
        accentColor={COLORS.warning}
        icon="fish-outline"
        trend="neutral"
      />
    </View>
  );
}

export function KpiMortalityWidget({ dashboard }: { dashboard: any }) {
  const rate = dashboard?.mortalityRate ?? 0;
  return (
    <View style={styles.kpiRow}>
      <KpiCard
        label="Mortalité"
        value={`${rate}%`}
        accentColor={rate > 5 ? COLORS.danger : COLORS.textSecondary}
        icon="alert-circle-outline"
        trend={rate > 5 ? "up" : "down"}
      />
      <KpiCard
        label="Fertilité"
        value={`${dashboard?.fertilityRate ?? 0}%`}
        accentColor={COLORS.primary}
        icon="heart-outline"
        trend="up"
      />
    </View>
  );
}

export function GmqTrendWidget({ dashboard }: { dashboard: any }) {
  const data = dashboard?.gmqTrend;
  const hasData = data && data.length > 1;

  const chartData = useMemo(() => {
    if (!hasData) return null;
    return {
      labels: data.map((p: any) => p.month.slice(5)),
      datasets: [
        {
          data: data.map((p: any) => p.avgWeight),
          color: () => COLORS.primary,
          strokeWidth: 3,
        },
      ],
    };
  }, [data, hasData]);

  return (
    <View style={styles.chartContainer}>
      {chartData ? (
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - 48}
          height={220}
          yAxisSuffix=" kg"
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withVerticalLines={false}
          withDots={true}
          segments={4}
        />
      ) : (
        <EmptyState message="Pas assez de données pour tracer la courbe." />
      )}
    </View>
  );
}

export function BreedDistributionWidget({ dashboard }: { dashboard: any }) {
  const data = dashboard?.herd.breedDistribution;

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    return {
      labels: data.map((b: any) => b.breed.length > 8 ? b.breed.slice(0, 7) + "…" : b.breed),
      datasets: [
        {
          data: data.map((b: any) => b.count),
           colors: data.map((_b: any, i: number) => () => [COLORS.primary, COLORS.info, COLORS.purple, COLORS.warning][i % 4]),
        },
      ],
    };
  }, [data]);

  return (
    <View style={styles.chartContainer}>
      {chartData ? (
        <BarChart
          data={chartData}
          width={SCREEN_WIDTH - 48}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars
          withHorizontalLabels={false}
        />
      ) : (
        <EmptyState message="Aucun animal enregistré pour l'instant." />
      )}
    </View>
  );
}

export function FinancialWidget({ financials }: { financials: any }) {
  const monthly = financials?.monthly;

  const chartData = useMemo(() => {
    if (!monthly || monthly.length <= 1) return null;
    return {
      labels: monthly.map((m: any) => m.month.slice(5)),
      datasets: [
        {
          data: monthly.map((m: any) => m.totalRevenues),
          color: () => COLORS.primary,
          strokeWidth: 3,
        },
        {
          data: monthly.map((m: any) => m.totalExpenses),
          color: () => COLORS.danger,
          strokeWidth: 3,
        },
      ],
      legend: ["Recettes", "Dépenses"],
    };
  }, [monthly]);

  return (
    <View>
      <View style={styles.kpiRow}>
        <KpiCard
          label="Recettes"
          value={formatMad(financials?.totalRevenues ?? 0)}
          accentColor={COLORS.primary}
          icon="arrow-up-circle-outline"
          trend="up"
        />
        <KpiCard
          label="Dépenses"
          value={formatMad(financials?.totalExpenses ?? 0)}
          accentColor={COLORS.danger}
          icon="arrow-down-circle-outline"
          trend="down"
        />
        <KpiCard
          label="Marge nette"
          value={formatMad(financials?.netMargin ?? 0)}
          accentColor={(financials?.netMargin ?? 0) >= 0 ? COLORS.primary : COLORS.danger}
          icon="wallet-outline"
          trend={(financials?.netMargin ?? 0) >= 0 ? "up" : "down"}
        />
      </View>
      {chartData ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={SCREEN_WIDTH - 48}
            height={220}
            yAxisSuffix=" MAD"
            chartConfig={chartConfig}
            style={styles.chart}
            withVerticalLines={false}
            segments={4}
          />
        </View>
      ) : (
        <EmptyState message="Pas assez de données financières sur la période." />
      )}
    </View>
  );
}

export function AlertsWidget({ alerts }: { alerts: any[] }) {
  if (alerts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="shield-checkmark-outline" size={36} color={COLORS.primary} />
        <EmptyState message="Aucune alerte active." />
      </View>
    );
  }

  return (
    <View style={styles.alertsList}>
      {alerts.map((alert: any, idx: number) => {
        const isCritical = alert.severity === "CRITICAL";
        const accentColor = isCritical ? COLORS.danger : COLORS.warning;
        const bgColor = isCritical ? COLORS.dangerLight : COLORS.warningLight;
        const iconName = isCritical ? "alert-circle" : "warning-outline";

        return (
          <View key={alert.id} style={[styles.alertCard, { borderLeftColor: accentColor, backgroundColor: bgColor }]}>
            <View style={styles.alertHeader}>
              <View style={[styles.alertIcon, { backgroundColor: accentColor + "18" }]}>
                <Ionicons name={iconName as any} size={18} color={accentColor} />
              </View>
              <View style={styles.alertBody}>
                <Text style={[styles.alertBatch, { color: accentColor }]}>{alert.batchName}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
            </View>
            {idx < alerts.length - 1 && <View style={styles.alertDivider} />}
          </View>
        );
      })}
    </View>
  );
}

export function RacesTableWidget({ dashboard }: { dashboard: any }) {
  return (
    <View style={styles.tableContainer}>
      {dashboard && dashboard.herd.breedDistribution.length > 0 ? (
        dashboard.herd.breedDistribution.map((breed: any, idx: number) => (
          <View
            key={breed.breed}
            style={[
              styles.dataRow,
              idx % 2 === 1 && styles.dataRowAlt,
            ]}
          >
            <View style={styles.dataRowLeft}>
              <View style={[styles.dataDot, { backgroundColor: [COLORS.primary, COLORS.info, COLORS.purple, COLORS.warning][idx % 4] }]} />
              <Text style={styles.dataLabel}>{breed.breed}</Text>
            </View>
            <Text style={styles.dataValue}>{breed.count} <Text style={styles.dataUnit}>têtes</Text></Text>
          </View>
        ))
      ) : (
        <EmptyState message="Aucune race enregistrée." />
      )}
    </View>
  );
}

export function ChargesTableWidget({ financials }: { financials: any }) {
  const breakdown = financials?.costBreakdown ?? [];
  return (
    <View style={styles.tableContainer}>
      {breakdown.length === 0 ? (
        <EmptyState message="Aucune charge enregistrée sur la période." />
      ) : (
        breakdown.map((item: any, idx: number) => (
          <View
            key={item.category}
            style={[
              styles.dataRow,
              idx % 2 === 1 && styles.dataRowAlt,
            ]}
          >
            <View style={styles.dataRowLeft}>
              <View style={[styles.dataDot, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.dataLabel}>{item.category}</Text>
            </View>
            <Text style={[styles.dataValue, { color: COLORS.danger }]}>{formatMad(item.total)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

export function CalendarWidget({ events }: { events: any[] }) {
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const typeConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; label: string }> = {
    lambing: { icon: "heart", color: COLORS.primary, bg: COLORS.primaryLight, label: "Mise bas" },
    heat: { icon: "flame", color: COLORS.warning, bg: COLORS.warningLight, label: "Réchauffement" },
    vaccination: { icon: "medkit", color: COLORS.info, bg: COLORS.infoLight, label: "Vaccination" },
    booster: { icon: "repeat", color: COLORS.purple, bg: COLORS.purpleLight, label: "Rappel" },
  };

  return (
    <View style={styles.calendarContainer}>
      {sorted.length === 0 ? (
        <EmptyState message="Aucun événement à venir." />
      ) : (
        sorted.map((evt) => {
          const config = typeConfig[evt.type] ?? { icon: "calendar", color: COLORS.muted, bg: COLORS.background, label: evt.type };
          const dateObj = new Date(evt.date + "T00:00:00");
          const day = dateObj.getDate().toString().padStart(2, "0");
          const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
          const weekday = dateObj.toLocaleDateString("fr-FR", { weekday: "short" });

          return (
            <View key={`${evt.type}-${evt.id}`} style={styles.eventRow}>
              <View style={[styles.eventDate, { borderLeftColor: config.color, backgroundColor: config.bg }]}>
                <Text style={[styles.eventWeekday, { color: config.color }]}>{weekday}</Text>
                <Text style={styles.eventDay}>{day}</Text>
                <Text style={styles.eventMonth}>{month}</Text>
              </View>
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <View style={[styles.eventIcon, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon} size={16} color={config.color} />
                  </View>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                </View>
                {evt.animalName ? <Text style={styles.eventAnimal}>{evt.animalName}</Text> : null}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function KpiCard({ label, value, accentColor, icon, trend }: {
  label: string;
  value: string;
  accentColor?: string;
  icon?: string;
  trend?: "up" | "down" | "neutral" | null;
}) {
  const color = accentColor || COLORS.textSecondary;
  const showTrend = trend && trend !== "neutral";

  return (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <View style={styles.kpiHeader}>
        {icon && (
          <View style={[styles.kpiIcon, { backgroundColor: color + "14" }]}>
            <Ionicons name={icon as any} size={18} color={color} />
          </View>
        )}
        {showTrend && (
          <View style={[styles.trendBadge, {
            backgroundColor: trend === "up" ? COLORS.primaryLight : COLORS.dangerLight,
          }]}>
            <Ionicons
              name={trend === "up" ? "arrow-up" : "arrow-down"}
              size={12}
              color={trend === "up" ? COLORS.primary : COLORS.danger}
            />
          </View>
        )}
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={28} color={COLORS.border} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function formatMad(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} MAD`;
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kpiHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  kpiIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  trendBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  kpiValue: { fontSize: 22, fontWeight: "800", color: COLORS.text, letterSpacing: -0.3 },
  kpiLabel: { fontSize: 11, color: COLORS.muted, marginTop: 4, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  chartContainer: { marginTop: 12, borderRadius: 16, overflow: "hidden", backgroundColor: COLORS.card, padding: 8, shadowColor: COLORS.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  chart: { borderRadius: 12, marginVertical: 4 },
  emptyContainer: { alignItems: "center", paddingVertical: 32 },
  emptyState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { color: COLORS.muted, fontSize: 13, textAlign: "center" },
  tableContainer: { backgroundColor: COLORS.card, borderRadius: 16, overflow: "hidden", shadowColor: COLORS.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  dataRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dataRowAlt: { backgroundColor: "#FAFCFB" },
  dataRowLeft: { flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 12, gap: 10 },
  dataDot: { width: 8, height: 8, borderRadius: 4 },
  dataLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, flex: 1 },
  dataValue: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  dataUnit: { fontSize: 11, fontWeight: "500", color: COLORS.muted },
  alertsList: { gap: 8 },
  alertCard: { borderRadius: 14, padding: 14, borderLeftWidth: 4, shadowColor: COLORS.shadowMedium, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  alertHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  alertIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 1 },
  alertBody: { flex: 1 },
  alertBatch: { fontWeight: "700", fontSize: 13, marginBottom: 3, letterSpacing: 0.2 },
  alertMessage: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  alertDivider: { height: 1, backgroundColor: COLORS.border, marginTop: 10, marginLeft: 44 },
  calendarContainer: { gap: 8 },
  eventRow: { flexDirection: "row", backgroundColor: COLORS.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", shadowColor: COLORS.shadow, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  eventDate: { width: 56, alignItems: "center", justifyContent: "center", borderLeftWidth: 4, paddingLeft: 10, marginRight: 14, borderRadius: 10 },
  eventWeekday: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  eventDay: { fontSize: 20, fontWeight: "800", color: COLORS.text, lineHeight: 24 },
  eventMonth: { fontSize: 11, fontWeight: "600", color: COLORS.muted },
  eventContent: { flex: 1 },
  eventHeader: { flexDirection: "row", alignItems: "center", marginBottom: 2, gap: 8 },
  eventIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  eventTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text, flex: 1 },
  eventAnimal: { fontSize: 12, color: COLORS.muted, marginLeft: 36, marginTop: 2 },
});
