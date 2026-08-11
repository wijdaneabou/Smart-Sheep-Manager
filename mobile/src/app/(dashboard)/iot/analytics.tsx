import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getTemperatureTrend,
  getGrazingTime,
  getDistance,
  compareAnimals,
  type TemperaturePoint,
  type GrazingPoint,
  type DistancePoint,
  type AnimalComparison,
} from "../../../services/iotAnalyticsService";
import { BackButton } from "../../../components/BackButton";
import { useAuth } from "../../../hooks/useAuth";

const GREEN = "#14532d";
const BORDER = "#E7E4DC";
const TEXT_MUTED = "#8A8A85";
const DAYS_OPTIONS = [7, 14, 30];

/**
 * Cet écran compare tous les animaux de l'exploitation (onglet "Comparaison"),
 * et affiche l'historique détaillé du premier bouclier sélectionné dans les
 * autres onglets. Adaptez selectedShieldId si vous voulez un sélecteur dédié.
 */
export default function IotAnalyticsScreen() {
  const { user } = useAuth();
  const exploitationId = (user as any)?.exploitationId;

  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<AnimalComparison[]>([]);
  const [selectedShieldId, setSelectedShieldId] = useState<number | null>(null);
  const [tempTrend, setTempTrend] = useState<TemperaturePoint[]>([]);
  const [grazing, setGrazing] = useState<GrazingPoint[]>([]);
  const [distance, setDistance] = useState<DistancePoint[]>([]);
  const [totalKm, setTotalKm] = useState(0);

  async function fetchAll() {
    if (!exploitationId) return;

    const compResult = await compareAnimals(exploitationId, days);
    if (!compResult.success) {
      Alert.alert("Erreur", compResult.message);
      return;
    }
    setComparison(compResult.data);

    const shieldId = selectedShieldId ?? compResult.data[0]?.shieldId ?? null;
    setSelectedShieldId(shieldId);
    if (!shieldId) return;

    const [tempResult, grazingResult, distResult] = await Promise.all([
      getTemperatureTrend(shieldId, days),
      getGrazingTime(shieldId, days),
      getDistance(shieldId, days),
    ]);

    if (tempResult.success) setTempTrend(tempResult.data);
    if (grazingResult.success) setGrazing(grazingResult.data);
    if (distResult.success) {
      setDistance(distResult.data);
      setTotalKm(distResult.totalKm);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll().finally(() => setLoading(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exploitationId, days, selectedShieldId])
  );

  function formatDay(day: string): string {
    const d = new Date(day);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  }

  const maxTemp = Math.max(...tempTrend.map((t) => t.maxTemperature), 41);
  const maxGrazing = 100;
  const maxDistance = Math.max(...distance.map((d) => d.distanceKm), 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton variant="dark" style={styles.backButton} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Historique & Analytics</Text>
          <Text style={styles.subtitle}>Tendances sur {days} jours</Text>
        </View>
      </View>

      <View style={styles.periodRow}>
        {DAYS_OPTIONS.map((d) => (
          <Pressable
            key={d}
            style={[styles.periodPill, days === d && styles.periodPillActive]}
            onPress={() => setDays(d)}
          >
            <Text style={[styles.periodPillText, days === d && styles.periodPillTextActive]}>
              {d} j
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={GREEN} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* ── Comparaison inter-animaux ── */}
          <SectionTitle icon="git-compare-outline" label="Comparaison inter-animaux" />
          {comparison.length === 0 ? (
            <Text style={styles.emptyText}>Aucun animal avec bouclier associé.</Text>
          ) : (
            <View style={styles.card}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Animal</Text>
                <Text style={styles.tableHeaderCell}>Temp.</Text>
                <Text style={styles.tableHeaderCell}>Pâturage</Text>
                <Text style={styles.tableHeaderCell}>Distance</Text>
              </View>
              {comparison.map((a) => (
                <Pressable
                  key={a.shieldId}
                  style={[
                    styles.tableRow,
                    selectedShieldId === a.shieldId && styles.tableRowSelected,
                  ]}
                  onPress={() => setSelectedShieldId(a.shieldId)}
                >
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: "700" }]}>
                    {a.animalName}
                  </Text>
                  <Text style={styles.tableCell}>
                    {a.avgTemperature !== null ? `${a.avgTemperature}°C` : "—"}
                  </Text>
                  <Text style={styles.tableCell}>
                    {a.grazingPercent !== null ? `${a.grazingPercent}%` : "—"}
                  </Text>
                  <Text style={styles.tableCell}>{a.distanceKm} km</Text>
                </Pressable>
              ))}
            </View>
          )}

          {selectedShieldId && (
            <>
              {/* ── Tendance température ── */}
              <SectionTitle icon="thermometer-outline" label="Tendance de température" />
              <View style={styles.card}>
                {tempTrend.length === 0 ? (
                  <Text style={styles.emptyText}>Pas assez de données.</Text>
                ) : (
                  <View style={styles.barChart}>
                    {tempTrend.map((t) => (
                      <View key={t.day} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: `${(t.avgTemperature / maxTemp) * 100}%`,
                                backgroundColor:
                                  t.maxTemperature > 40.5 ? "#B42318" : GREEN,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barValue}>{t.avgTemperature.toFixed(1)}°</Text>
                        <Text style={styles.barLabel}>{formatDay(t.day)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* ── Temps de pâturage ── */}
              <SectionTitle icon="leaf-outline" label="Temps de pâturage" />
              <View style={styles.card}>
                {grazing.length === 0 ? (
                  <Text style={styles.emptyText}>Pas assez de données.</Text>
                ) : (
                  <View style={styles.barChart}>
                    {grazing.map((g) => (
                      <View key={g.day} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: `${(g.grazingPercent / maxGrazing) * 100}%`,
                                backgroundColor: "#0F7A3C",
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barValue}>{g.estimatedHours}h</Text>
                        <Text style={styles.barLabel}>{formatDay(g.day)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* ── Distance parcourue ── */}
              <SectionTitle icon="footsteps-outline" label="Distance parcourue" />
              <View style={styles.card}>
                <Text style={styles.totalDistance}>{totalKm} km au total</Text>
                {distance.length === 0 ? (
                  <Text style={styles.emptyText}>Pas assez de données.</Text>
                ) : (
                  <View style={styles.barChart}>
                    {distance.map((d) => (
                      <View key={d.day} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: `${(d.distanceKm / maxDistance) * 100}%`,
                                backgroundColor: "#175CD3",
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barValue}>{d.distanceKm}</Text>
                        <Text style={styles.barLabel}>{formatDay(d.day)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SectionTitle({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={16} color={GREEN} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAF8F4" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  backButton: { marginRight: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#1A1A18" },
  subtitle: { fontSize: 12.5, color: TEXT_MUTED, marginTop: 2 },

  periodRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  periodPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
  },
  periodPillActive: { backgroundColor: "#F0FDF4", borderColor: "#BEE3C8" },
  periodPillText: { fontSize: 12.5, fontWeight: "600", color: TEXT_MUTED },
  periodPillTextActive: { color: GREEN },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1A1A18" },

  emptyText: { fontSize: 12.5, color: TEXT_MUTED, textAlign: "center", paddingVertical: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: "700",
    color: TEXT_MUTED,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F3EF",
    borderRadius: 8,
  },
  tableRowSelected: { backgroundColor: "#F0FDF4" },
  tableCell: { flex: 1, fontSize: 12.5, color: "#1A1A18" },

  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 140,
    paddingTop: 8,
  },
  barColumn: { alignItems: "center", flex: 1 },
  barTrack: {
    width: 18,
    height: 90,
    justifyContent: "flex-end",
    backgroundColor: "#F5F3EF",
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: { width: "100%", borderRadius: 6 },
  barValue: { fontSize: 10.5, fontWeight: "700", color: "#1A1A18", marginTop: 4 },
  barLabel: { fontSize: 9.5, color: TEXT_MUTED, marginTop: 1 },

  totalDistance: { fontSize: 18, fontWeight: "800", color: GREEN, marginBottom: 10 },
});