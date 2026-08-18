import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { BcsRadarChart } from "@/components/BcsRadarChart";
import { BcsScoreBadge } from "@/components/BcsScoreBadge";
import { getBcsHistory, type BcsHistoryResponse, type BcsRecord } from "@/services/animalBcsService";
import { getBreedInfo } from "@/constants/breeds";
import { usePermissions } from "@/contexts/PermissionsContext"; // 👈 NEW IMPORT

export default function AnimalBcsHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animalId = Number(id);
  const router = useRouter();
  const { hasPermission } = usePermissions(); // 👈 NEW

  const [data, setData] = useState<BcsHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<BcsRecord | null>(null);

  const fetchHistory = async () => {
    setError(null);
    const result = await getBcsHistory(animalId);
    if (result.success) {
      setData(result.data);
      if (result.data.latestRecord) {
        setSelectedRecord(result.data.latestRecord);
      }
    } else {
      setError(result.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchHistory().finally(() => setLoading(false));
    }, [animalId])
  );

  const handleAddBcs = () => {
    router.push(`/herd/${animalId}/bcs/add` as any);
  };

  if (loading) {
    return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
      </View>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
      </View>
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? "Impossible de charger les données."}</Text>
      </View>
    </SafeAreaView>
    );
  }

  const breedInfo = getBreedInfo(data.animal.breed);
  const latest = selectedRecord ?? data.latestRecord;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        {/* 👇 Add BCS button - HERD:UPDATE */}
        {hasPermission('HERD', 'UPDATE') && (
          <Pressable onPress={handleAddBcs} style={styles.addButton} hitSlop={8}>
            <Text style={styles.addIcon}>➕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* ENTÊTE ANIMAL */}
        <View style={styles.animalCard}>
          <Image
              source={{
                uri: `http://172.27.182.10:3000${data.animal.photoUrl}`,
              }}
              style={styles.animalImage}
            />
          <View style={{ flex: 1 }}>
            <Text style={styles.animalName}>{data.animal.name}</Text>
            <Text style={styles.animalSubtitle}>
              {data.animal.officialId ? `ID: ${data.animal.officialId} • ` : ""}
              {breedInfo.label}
            </Text>
          </View>
          {data.trend && (
            <View style={styles.trendBadge}>
              <Text style={styles.trendIcon}>
                {data.trend === "UP" ? "📈" : data.trend === "DOWN" ? "📉" : "➡️"}
              </Text>
              <Text style={styles.trendText}>
                {data.trend === "UP" ? "+ Prise" : data.trend === "DOWN" ? "- Perte" : "Stable"}
              </Text>
            </View>
          )}
        </View>

        {/* SI AUCUN BCS ENREGISTRÉ */}
        {!latest ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Aucune évaluation BCS</Text>
            <Text style={styles.emptyText}>
              Cet animal n'a pas encore de score d'état corporel enregistré.
            </Text>
            {/* 👇 Add BCS button in empty state - HERD:UPDATE */}
            {hasPermission('HERD', 'UPDATE') && (
              <Pressable onPress={handleAddBcs} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Évaluer le BCS maintenant</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            {/* CARTE DE VISUALISATION RADAR */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Visualisation Radar</Text>
                <Text style={styles.recordDate}>{latest.dateStr}</Text>
              </View>

              <View style={{ alignItems: "center", marginVertical: 8 }}>
                <BcsScoreBadge
                  score={latest.bcsScore}
                  label={latest.category.label}
                  color={latest.category.color}
                  size="lg"
                />
              </View>

              <BcsRadarChart
                values={{
                  spinousProcesses: latest.spinousProcesses,
                  transverseProcesses: latest.transverseProcesses,
                  eyeMuscle: latest.eyeMuscle,
                  fatCover: latest.fatCover,
                  tailDock: latest.tailDock,
                }}
                showIdealOverlay={true}
                size={270}
              />

              {/* DIAGNOSTIC ET RECOMMANDATION NUTRITIONNELLE */}
              <View style={[styles.diagnosisBox, { borderColor: latest.category.color }]}>
                <Text style={[styles.diagnosisTitle, { color: latest.category.color }]}>
                  💡 Diagnostic : {latest.category.description}
                </Text>
                <Text style={styles.diagnosisText}>
                  {latest.nutritionalRecommendation ?? latest.category.defaultRecommendation}
                </Text>
                {latest.evaluator && (
                  <Text style={styles.evaluatorText}>👤 Évaluateur : {latest.evaluator}</Text>
                )}
                {latest.notes && (
                  <Text style={styles.notesText}>📝 Note : {latest.notes}</Text>
                )}
              </View>
            </View>

            {/* HISTORIQUE DES ÉVALUATIONS */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Historique des évaluations ({data.records.length})</Text>

              {data.records.map((item) => {
                const isSelected = selectedRecord?.id === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedRecord(item)}
                    style={[styles.historyRow, isSelected && styles.historyRowSelected]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyDate}>{item.dateStr}</Text>
                      {item.evaluator && (
                        <Text style={styles.historySub}>{item.evaluator}</Text>
                      )}
                    </View>
                    <BcsScoreBadge
                      score={item.bcsScore}
                      label={item.category.label}
                      color={item.category.color}
                      size="sm"
                    />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const PAGE_BG = "#FAF3EA";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backButtonText: { fontSize: 28, color: "#111827" },
  addButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#059669", alignItems: "center", justifyContent: "center" },
  addIcon: { fontSize: 18, color: "#FFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#DC2626", fontSize: 14, textAlign: "center" },
  container: { padding: 16, gap: 16, paddingTop: 4, paddingBottom: 40 },
  animalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  animalImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: "cover",
    backgroundColor: "#E5E7EB",
  },
  animalIcon: { fontSize: 32 },
  animalName: { fontSize: 17, fontWeight: "700", color: "#0F2A1D" },
  animalSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendIcon: { fontSize: 14 },
  trendText: { fontSize: 11, fontWeight: "700", color: "#374151" },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 4,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#6B7280", textAlign: "center", marginBottom: 20 },
  primaryButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F2A1D" },
  recordDate: { fontSize: 12, color: "#6B7280" },
  diagnosisBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    marginTop: 12,
    gap: 4,
  },
  diagnosisTitle: { fontSize: 13, fontWeight: "700" },
  diagnosisText: { fontSize: 12, color: "#374151", lineHeight: 17 },
  evaluatorText: { fontSize: 11, color: "#6B7280", marginTop: 4 },
  notesText: { fontSize: 11, color: "#4B5563", fontStyle: "italic" },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginTop: 4,
  },
  historyRowSelected: {
    backgroundColor: "#E6F8ED",
  },
  historyDate: { fontSize: 13, fontWeight: "600", color: "#111827" },
  historySub: { fontSize: 11, color: "#6B7280", marginTop: 1 },
});