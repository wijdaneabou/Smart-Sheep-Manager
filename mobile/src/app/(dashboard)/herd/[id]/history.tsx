import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  getAnimalHistory,
  exportAnimalHistoryPdf,
  type HistoryEvent,
  type HistoryFilters,
} from "../../../../services/animalHistoryService";
import {
  HISTORY_CATEGORIES,
  getCategoryInfo,
  type HistoryCategory,
  type HistoryCategoryInfo,
} from "../../../../constants/history";

export default function AnimalHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animalId = Number(id);
  const router = useRouter();

  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<HistoryCategory | "all">("all");

  const filters: HistoryFilters =
    activeCategory === "all" ? {} : { category: activeCategory };

  async function fetchHistory() {
    setError(null);
    const result = await getAnimalHistory(animalId, filters);
    if (result.success) {
      setEvents(result.events);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchHistory().finally(() => setLoading(false));
    }, [animalId, activeCategory])
  );

  async function handleExport() {
    setExporting(true);
    const result = await exportAnimalHistoryPdf(animalId, filters);
    setExporting(false);
    if (!result.success) {
      Alert.alert("Erreur", result.message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Historique</Text>
        <Pressable
          onPress={handleExport}
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          disabled={exporting}
          hitSlop={8}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#059669" />
          ) : (
            <Text style={styles.exportIcon}>📤</Text>
          )}
        </Pressable>
      </View>

      {/* Category filter pills */}
      <View style={styles.filterRow}>
        {HISTORY_CATEGORIES.map((cat: HistoryCategoryInfo) => {
          const isActive = activeCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id as HistoryCategory | "all")}
              style={[
                styles.filterPill,
                isActive && { backgroundColor: cat.color + "20", borderColor: cat.color },
              ]}
            >
              <Text style={[styles.filterPillText, isActive && { color: cat.color, fontWeight: "700" }]}>
                {cat.icon} {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Aucun événement</Text>
          <Text style={styles.empty}>
            Aucun événement enregistré pour cette catégorie.
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => `${item.category}-${item.id}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <HistoryEventCard event={item} />}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      )}
    </SafeAreaView>
  );
}

function HistoryEventCard({ event }: { event: HistoryEvent }) {
  const catInfo = getCategoryInfo(event.category);
  const dateStr = new Date(event.date).toLocaleDateString("fr-FR");

  return (
    <View style={styles.eventCard}>
      {/* Timeline dot */}
      <View style={[styles.timelineDot, { backgroundColor: catInfo.color }]}>
        <Text style={styles.timelineIcon}>{catInfo.icon}</Text>
      </View>

      {/* Event content */}
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: catInfo.color + "15" }]}>
            <Text style={[styles.categoryLabel, { color: catInfo.color }]}>
              {catInfo.label}
            </Text>
          </View>
          <Text style={styles.eventDate}>{dateStr}</Text>
        </View>

        <Text style={styles.eventTitle}>{event.title}</Text>

        {event.description ? (
          <Text style={styles.eventDescription}>{event.description}</Text>
        ) : null}

        {/* Category-specific details */}
        <EventDetails event={event} />
      </View>
    </View>
  );
}

function EventDetails({ event }: { event: HistoryEvent }) {
  const details: string[] = [];

  if (event.category === "health" || event.category === "treatment") {
    if (event.veterinarian) details.push(`Vétérinaire : ${event.veterinarian}`);
    if (event.medication) details.push(`Médicament : ${event.medication}`);
    if (event.dosage) details.push(`Dosage : ${event.dosage}`);
    if (event.status) details.push(`Statut : ${event.status}`);
  }

  if (event.category === "reproduction") {
    if (event.eventType) {
      const typeLabels: Record<string, string> = {
        BREEDING: "Saillie",
        PREGNANCY_CHECK: "Contrôle de grossesse",
        BIRTH: "Mise-bas",
        WEANING: "Séparation des agneaux",
      };
      details.push(`Type : ${typeLabels[event.eventType] ?? event.eventType}`);
    }
    if (event.partnerId) details.push(`Partenaire (ID) : ${event.partnerId}`);
    if (event.result) details.push(`Résultat : ${event.result}`);
  }

  if (event.category === "weight") {
    if (event.weight) details.push(`Poids : ${event.weight} kg`);
    if (event.bcs) details.push(`BCS : ${event.bcs}`);
  }

  if (details.length === 0) return null;

  return (
    <View style={styles.detailsContainer}>
      {details.map((d, i) => (
        <Text key={i} style={styles.detailText}>
          • {d}
        </Text>
      ))}
    </View>
  );
}

const PAGE_BG = "#faf3ea";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backButtonText: { fontSize: 26, color: "#1a1a1a", fontWeight: "400" },
  headerTitle: { fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },
  exportButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  exportButtonDisabled: { opacity: 0.5 },
  exportIcon: { fontSize: 16 },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  filterPillText: { fontSize: 12, color: "#555" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  error: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 4 },
  empty: { fontSize: 13, color: "#888", textAlign: "center" },

  listContent: { paddingHorizontal: 16, paddingBottom: 16 },

  eventCard: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  timelineIcon: { fontSize: 16 },
  eventContent: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryLabel: { fontSize: 11, fontWeight: "700" },
  eventDate: { fontSize: 12, color: "#999" },
  eventTitle: { fontSize: 14, fontWeight: "700", color: "#0F2A1D", marginBottom: 4 },
  eventDescription: { fontSize: 13, color: "#555", marginBottom: 6, lineHeight: 18 },
  detailsContainer: { marginTop: 4 },
  detailText: { fontSize: 12, color: "#666", lineHeight: 17 },
});
