import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { reproductionService } from "../../../../services/reproductionService";
import { getAnimalById } from "../../../../services/animalsService";
import { BackButton } from "../../../../components/BackButton";

// ── Design tokens ──
const GREEN = "#14532d";
const GREEN_EMERALD = "#059669";
const BACKGROUND = "#f8fafc";
const CARD_BG = "#ffffff";
const TEXT_DARK = "#1f2937";
const TEXT_MUTED = "#6b7280";

export default function PerformanceScreen() {
  const { animalId } = useLocalSearchParams<{ animalId: string }>();
  const id = parseInt(animalId);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const [animalName, setAnimalName] = useState("");

  async function loadData() {
    try {
      const animalResult = await getAnimalById(id);
      if (animalResult.success) {
        setAnimalName(animalResult.animal.name);
      }

      const perfResult = await reproductionService.getPerformance(id);
      setPerformance(perfResult.data.data);
    } catch (error) {
      console.error("Erreur chargement performance", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Performance</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN_EMERALD} />
        </View>
      </SafeAreaView>
    );
  }

  if (!performance) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton variant="dark" style={styles.backButton} />
          <Text style={styles.headerTitle}>Performance</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.error}>Aucune donnée disponible.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
        <Text style={styles.headerTitle}>Performance</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.animalName}>{animalName}</Text>

        {/* Statistiques générales */}
        <View style={styles.statsRow}>
          <StatCard
            icon="repeat"
            iconColor={GREEN}
            value={performance.totalCycles}
            label="Cycles"
          />
          <StatCard
            icon="checkmark-circle"
            iconColor={GREEN_EMERALD}
            value={performance.confirmedCycles}
            label="Confirmés"
          />
        </View>

        {/* Indicateurs principaux */}
        <View style={styles.section}>
          <SectionTitle label="Taux de fertilité" />
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{performance.fertilityRate}%</Text>
            <Text style={styles.metricSub}>
              {performance.confirmedCycles} / {performance.totalCycles} cycles confirmés
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle label="Prolificité" />
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{performance.prolificity}</Text>
            <Text style={styles.metricSub}>Agneaux par mise bas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle label="Intervalle entre agnelages" />
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{performance.lambingInterval} jours</Text>
            <Text style={styles.metricSub}>Moyenne entre deux mises bas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle label="Taux de réussite des saillies" />
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{performance.matingSuccessRate}%</Text>
            <Text style={styles.metricSub}>Saillies ayant abouti à une gestation</Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle label="Services par gestation" />
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{performance.servicesPerPregnancy}</Text>
            <Text style={styles.metricSub}>Nombre moyen de saillies avant gestation</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sous‑composants ─────────────────────────────────────────────

function StatCard({ icon, iconColor, value, label }: any) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleContainer}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { marginRight: 0 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_DARK,
    flex: 1,
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  error: { color: "#dc2626", fontSize: 14, textAlign: "center" },

  container: { padding: 16, paddingBottom: 32 },

  animalName: {
    fontSize: 22,
    fontWeight: "800",
    color: GREEN,
    textAlign: "center",
    marginBottom: 16,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: "700", color: TEXT_DARK },
  statLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: "600" },

  section: { marginBottom: 16 },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionBar: { width: 4, height: 16, backgroundColor: GREEN, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: TEXT_MUTED },

  metricCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "800",
    color: GREEN,
    textAlign: "center",
  },
  metricSub: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: "center",
    marginTop: 4,
  },
});