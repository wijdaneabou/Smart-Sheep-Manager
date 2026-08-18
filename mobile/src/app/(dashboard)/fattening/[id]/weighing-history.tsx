import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";

import {
  getFatteningBatchById,
  getBatchGmqStats,
  listBatchWeightRecords,
  deleteBatchWeightRecord,
  type FatteningBatch,
  type GmqStats,
  type FatteningBatchWeightRecord,
} from "../../../../services/fatteningService";

import { usePermissions } from "@/contexts/PermissionsContext";
import Pagination from "@/components/Pagination";

const GREEN = "#14532d";

export default function BatchWeighingHistoryScreen() {
  const router = useRouter();

  /*
   * Expo Router peut retourner :
   * - une string : "12"
   * - un tableau : ["12"]
   * - undefined
   *
   * On normalise donc la valeur avant de la convertir en nombre.
   */
  const { id } = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const { hasPermission } = usePermissions();

  const rawId = Array.isArray(id) ? id[0] : id;

  const batchId = rawId
    ? Number.parseInt(rawId, 10)
    : NaN;

  const isValidBatchId =
    Number.isInteger(batchId) && batchId > 0;

  console.log("DEBUG BatchWeighingHistory:", {
    id,
    rawId,
    batchId,
    isValidBatchId,
  });

  const [batch, setBatch] = useState<FatteningBatch | null>(null);
  const [records, setRecords] = useState<
    FatteningBatchWeightRecord[]
  >([]);

  const [gmqStats, setGmqStats] =
    useState<GmqStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingGmq, setLoadingGmq] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  /**
   * Chargement du lot
   */
  const loadBatch = useCallback(async () => {
    if (!isValidBatchId) {
      setError("Identifiant du lot invalide.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const result = await getFatteningBatchById(batchId);

      if (result.success) {
        setBatch(result.batch);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Erreur chargement lot:", err);
      setError("Impossible de charger le lot.");
    } finally {
      setLoading(false);
    }
  }, [batchId, isValidBatchId]);

  /**
   * Chargement de l'historique des pesées
   */
  const loadRecords = useCallback(async () => {
    if (!isValidBatchId) {
      setLoadingRecords(false);
      return;
    }

    setLoadingRecords(true);

    try {
      const result = await listBatchWeightRecords(batchId, page, PAGE_SIZE);

      if (result.success) {
        setRecords(result.records);
        const total = result.pagination?.total ?? 0;
        const limit = result.pagination?.limit ?? PAGE_SIZE;
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Erreur chargement pesées:", err);
      setError("Impossible de charger l'historique des pesées.");
    } finally {
      setLoadingRecords(false);
    }
  }, [batchId, isValidBatchId, page]);

  /**
   * Chargement des statistiques GMQ
   */
  const loadGmq = useCallback(async () => {
    if (!isValidBatchId) {
      setLoadingGmq(false);
      return;
    }

    setLoadingGmq(true);

    try {
      const result = await getBatchGmqStats(batchId);

      if (result.success) {
        setGmqStats(result.stats);
      } else {
        console.error(
          "Erreur statistiques GMQ:",
          result.message
        );
      }
    } catch (err) {
      console.error("Erreur chargement GMQ:", err);
    } finally {
      setLoadingGmq(false);
    }
  }, [batchId, isValidBatchId]);

  /**
   * Chargement initial
   */
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!mounted) return;
      await Promise.all([loadBatch(), loadRecords(), loadGmq()]);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [loadBatch, loadRecords, loadGmq]);

  /**
   * Rafraîchissement
   */
  async function onRefresh() {
    if (!isValidBatchId) {
      setError("Identifiant du lot invalide.");
      return;
    }

    setRefreshing(true);

    try {
      await Promise.all([
        loadBatch(),
        loadRecords(),
        loadGmq(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  /**
   * Ajouter une pesée
   */
  function handleAddWeighing() {
    if (!isValidBatchId) {
      Alert.alert(
        "Erreur",
        "Identifiant du lot invalide."
      );
      return;
    }

    router.push(
      `/fattening/${batchId}/add-weighing` as any
    );
  }

  /**
   * Supprimer une pesée
   */
  async function handleDelete(
    record: FatteningBatchWeightRecord
  ) {
    Alert.alert(
      "Supprimer la pesée",
      `Supprimer la pesée du ${new Date(
        record.date
      ).toLocaleDateString(
        "fr-FR"
      )} (${Number(record.averageWeight).toFixed(
        2
      )} kg) ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const result =
                await deleteBatchWeightRecord(record.id);

              if (result.success) {
                setRecords((prev) =>
                  prev.filter(
                    (r) => r.id !== record.id
                  )
                );

                await loadGmq();
              } else {
                Alert.alert(
                  "Erreur",
                  result.message
                );
              }
            } catch (err) {
              console.error(
                "Erreur suppression pesée:",
                err
              );

              Alert.alert(
                "Erreur",
                "Impossible de supprimer la pesée."
              );
            }
          },
        },
      ]
    );
  }

  /**
   * GMQ global en grammes/jour
   */
  const overallGmqG =
    gmqStats?.history.overallGmq !== null &&
    gmqStats?.history.overallGmq !== undefined
      ? (
          gmqStats.history.overallGmq * 1000
        ).toFixed(0)
      : null;

  /**
   * GMQ moyen/jour en grammes/jour
   */
  const avgDailyGmqG =
    gmqStats?.history.averageDailyGmq !== null &&
    gmqStats?.history.averageDailyGmq !== undefined
      ? (
          gmqStats.history.averageDailyGmq * 1000
        ).toFixed(0)
      : null;

  /**
   * Identifiant invalide
   */
  if (!isValidBatchId) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={GREEN}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Historique des pesées
          </Text>

          <View style={{ width: 32 }} />
        </View>

        <View style={styles.center}>
          <Text style={styles.errorText}>
            Identifiant du lot invalide.
          </Text>

          <Text style={styles.debugText}>
            ID reçu :{" "}
            {rawId ?? "undefined"}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>
              RETOUR
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Chargement du lot
   */
  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={GREEN}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Historique des pesées
          </Text>

          <View style={{ width: 32 }} />
        </View>

        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#15803D"
          />
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Erreur ou lot introuvable
   */
  if (error || !batch) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={GREEN}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Historique des pesées
          </Text>

          <View style={{ width: 32 }} />
        </View>

        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error || "Lot introuvable."}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={async () => {
              setError(null);

              await Promise.all([
                loadBatch(),
                loadRecords(),
                loadGmq(),
              ]);
            }}
          >
            <Text style={styles.retryButtonText}>
              RÉESSAYER
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={GREEN}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Historique des pesées
          </Text>

          <View style={{ width: 32 }} />
        </View>

        {/* INFORMATIONS LOT */}
        <View style={styles.batchInfoCard}>
          <Text style={styles.batchName}>
            {batch.name}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  STATUS_CONFIG[batch.status]
                    ?.bgColor ||
                  "#DCFCE7",
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    STATUS_CONFIG[batch.status]
                      ?.color ||
                    "#15803D",
                },
              ]}
            >
              {STATUS_CONFIG[batch.status]
                ?.label || "En cours"}
            </Text>
          </View>
        </View>

        {/* GMQ */}
        {loadingGmq ? (
          <View style={styles.gmqLoading}>
            <ActivityIndicator
              size="small"
              color="#15803D"
            />
          </View>
        ) : gmqStats &&
          gmqStats.history.totalRecords > 0 ? (
          <View style={styles.gmqCard}>
            <Text style={styles.gmqCardTitle}>
              Suivi GMQ
            </Text>

            <View style={styles.gmqGrid}>
              {/* GMQ global */}
              <View style={styles.gmqBox}>
                <Text style={styles.gmqLabel}>
                  GMQ global
                </Text>

                <Text style={styles.gmqValue}>
                  {overallGmqG
                    ? `${overallGmqG} g/j`
                    : "—"}
                </Text>
              </View>

              {/* GMQ moyen */}
              <View style={styles.gmqBox}>
                <Text style={styles.gmqLabel}>
                  GMQ moyen / jour
                </Text>

                <Text style={styles.gmqValue}>
                  {avgDailyGmqG
                    ? `${avgDailyGmqG} g/j`
                    : "—"}
                </Text>
              </View>

              {/* Première pesée */}
              <View style={styles.gmqBox}>
                <Text style={styles.gmqLabel}>
                  Première pesée
                </Text>

                <Text style={styles.gmqValue}>
                  {gmqStats.history.firstWeight !==
                  null
                    ? `${gmqStats.history.firstWeight.toFixed(
                        2
                      )} kg`
                    : "—"}
                </Text>
              </View>

              {/* Dernière pesée */}
              <View style={styles.gmqBox}>
                <Text style={styles.gmqLabel}>
                  Dernière pesée
                </Text>

                <Text style={styles.gmqValue}>
                  {gmqStats.history.lastWeight !==
                  null
                    ? `${gmqStats.history.lastWeight.toFixed(
                        2
                      )} kg`
                    : "—"}
                </Text>
              </View>

              {/* Nombre de pesées */}
              <View style={styles.gmqBox}>
                <Text style={styles.gmqLabel}>
                  Nombre de pesées
                </Text>

                <Text style={styles.gmqValue}>
                  {gmqStats.history.totalRecords}
                </Text>
              </View>

              {/* Jours écoulés */}
              <View style={styles.gmqBox}>
                <Text style={styles.gmqLabel}>
                  Jours écoulés
                </Text>

                <Text style={styles.gmqValue}>
                  {Math.floor(
                    gmqStats.daysElapsed
                  )}
                </Text>
              </View>
            </View>

            {/* Projection */}
            {gmqStats.projectedFinalWeight !==
              null && (
              <View
                style={styles.projectionBox}
              >
                <Text
                  style={
                    styles.projectionLabel
                  }
                >
                  Poids final projeté
                </Text>

                <Text
                  style={
                    styles.projectionValue
                  }
                >
                  {gmqStats.projectedFinalWeight.toFixed(
                    2
                  )}{" "}
                  kg
                </Text>

                <Text
                  style={
                    styles.projectionTarget
                  }
                >
                  Cible:{" "}
                  {gmqStats.targetWeight.toFixed(
                    2
                  )}{" "}
                  kg
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyGmqCard}>
            <Text style={styles.emptyGmqText}>
              Aucune pesée enregistrée
            </Text>

            <Text
              style={styles.emptyGmqSubtext}
            >
              Ajoutez une pesée pour suivre
              le GMQ du lot.
            </Text>
          </View>
        )}

        {/* HISTORIQUE */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>
              Historique des pesées
            </Text>

            {records.length > 0 && (
              <Text style={styles.recordCount}>
                {records.length} enregistrement
                {records.length > 1
                  ? "s"
                  : ""}
              </Text>
            )}
          </View>

          {loadingRecords ? (
            <View style={styles.center}>
              <ActivityIndicator
                size="small"
                color="#15803D"
              />
            </View>
          ) : records.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text
                style={styles.emptyHistoryText}
              >
                Aucune pesée enregistrée
              </Text>
            </View>
          ) : (
            <View style={styles.recordsList}>
              {records.map((record, index) => {
                /*
                 * On suppose que les records sont
                 * retournés du plus récent au plus ancien.
                 */
                const prevRecord =
                  records[index + 1];

                let dailyGmq: string | null =
                  null;

                if (prevRecord) {
                  const currentWeight =
                    Number(
                      record.averageWeight
                    );

                  const previousWeight =
                    Number(
                      prevRecord.averageWeight
                    );

                  const currentDate =
                    new Date(
                      record.date
                    ).getTime();

                  const previousDate =
                    new Date(
                      prevRecord.date
                    ).getTime();

                  const days =
                    (currentDate -
                      previousDate) /
                    (1000 *
                      60 *
                      60 *
                      24);

                  if (
                    Number.isFinite(
                      currentWeight
                    ) &&
                    Number.isFinite(
                      previousWeight
                    ) &&
                    days > 0
                  ) {
                    dailyGmq = (
                      ((currentWeight -
                        previousWeight) /
                        days) *
                      1000
                    ).toFixed(0);
                  }
                }

                return (
                  <View
                    key={record.id}
                    style={styles.recordCard}
                  >
                    <View
                      style={styles.recordLeft}
                    >
                      <View
                        style={
                          styles.recordIndex
                        }
                      >
                        <Text
                          style={
                            styles.recordIndexText
                          }
                        >
                          {records.length -
                            index}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.recordInfo
                        }
                      >
                        <Text
                          style={
                            styles.recordWeight
                          }
                        >
                          {Number(
                            record.averageWeight
                          ).toFixed(2)}{" "}
                          kg
                        </Text>

                        <Text
                          style={
                            styles.recordDate
                          }
                        >
                          {new Date(
                            record.date
                          ).toLocaleDateString(
                            "fr-FR",
                            {
                              weekday:
                                "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </Text>

                        {record.note ? (
                          <Text
                            style={
                              styles.recordNote
                            }
                          >
                            {record.note}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View
                      style={
                        styles.recordRight
                      }
                    >
                      {dailyGmq &&
                        !isNaN(
                          Number(dailyGmq)
                        ) &&
                        Number(dailyGmq) > 0 && (
                          <View
                            style={
                              styles.gmqIndicator
                            }
                          >
                            <Text
                              style={
                                styles.gmqIndicatorText
                              }
                            >
                              +{dailyGmq} g/j
                            </Text>
                          </View>
                        )}

                      {hasPermission(
                        "FATTENING",
                        "UPDATE"
                      ) && (
                        <Pressable
                          style={
                            styles.recordDeleteButton
                          }
                          onPress={() =>
                            handleDelete(
                              record
                            )
                          }
                        >
                          <Feather
                            name="trash-2"
                            size={16}
                            color="#dc2626"
                          />
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />

        {/* AJOUTER UNE PESÉE */}
        {hasPermission(
          "FATTENING",
          "UPDATE"
        ) && (
          <Pressable
            style={styles.addButton}
            onPress={handleAddWeighing}
          >
            <Feather
              name="plus"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />

            <Text
              style={styles.addButtonText}
            >
              AJOUTER UNE PESÉE
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  ACTIVE: {
    label: "En cours",
    color: "#15803D",
    bgColor: "#DCFCE7",
  },

  COMPLETED: {
    label: "Terminé",
    color: "#1D4ED8",
    bgColor: "#DBEAFE",
  },

  CANCELLED: {
    label: "Annulé",
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  container: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: GREEN,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },

  errorText: {
    color: "#dc2626",
    fontSize: 15,
    marginBottom: 16,
    textAlign: "center",
  },

  debugText: {
    color: "#666",
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
  },

  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  retryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  batchInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  batchName: {
    fontSize: 20,
    fontWeight: "800",
    color: GREEN,
    flex: 1,
    marginRight: 12,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  gmqLoading: {
    paddingVertical: 16,
    alignItems: "center",
  },

  gmqCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  gmqCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },

  gmqGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  gmqBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },

  gmqLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },

  gmqValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },

  projectionBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
  },

  projectionLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },

  projectionValue: {
    fontSize: 18,
    fontWeight: "800",
    color: GREEN,
  },

  projectionTarget: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
    marginTop: 2,
  },

  emptyGmqCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  emptyGmqText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },

  emptyGmqSubtext: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },

  historySection: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  historyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },

  recordCount: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },

  emptyHistory: {
    alignItems: "center",
    paddingVertical: 20,
  },

  emptyHistoryText: {
    fontSize: 13,
    color: "#888",
  },

  recordsList: {},

  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },

  recordLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  recordIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  recordIndexText: {
    fontSize: 12,
    fontWeight: "700",
    color: GREEN,
  },

  recordInfo: {
    flex: 1,
  },

  recordWeight: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },

  recordDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },

  recordNote: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },

  recordRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  gmqIndicator: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  gmqIndicatorText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },

  recordDeleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});