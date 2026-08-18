import { useCallback, useMemo, useState, type ReactNode, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../../services/api";
import { usePermissions } from "@/contexts/PermissionsContext";

type CarnetEventType = "health_record" | "treatment" | "vaccination";

type CarnetEvent = {
  type: CarnetEventType;
  date: string | Date;
  data: any;
};

type CarnetData = {
  animal: {
    id: number;
    name: string;
    rfid: string;
    breed: string;
    sex: string;
    birthDate: string | Date | null;
  };
  events: CarnetEvent[];
};

const healthStatusLabels: Record<string, string> = {
  HEALTHY: "Sain",
  SURVEILLANCE: "Surveillance",
  SICK: "Malade",
  UNDER_TREATMENT: "En traitement",
  RECOVERED: "Rétabli",
};

const statusColors: Record<string, string> = {
  HEALTHY: "#16a34a",
  SURVEILLANCE: "#ca8a04",
  SICK: "#dc2626",
  UNDER_TREATMENT: "#ea580c",
  RECOVERED: "#2563eb",
  PENDING: "#ca8a04",
  DONE: "#16a34a",
  OVERDUE: "#dc2626",
};

const statusLabels: Record<string, string> = {
  HEALTHY: "Sain",
  SURVEILLANCE: "Surveillance",
  SICK: "Malade",
  UNDER_TREATMENT: "En traitement",
  RECOVERED: "Rétabli",
  PENDING: "En attente",
  DONE: "Effectué",
  OVERDUE: "En retard",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function formatShortDate(value: string | Date | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(toDate(value));
}

export default function CarnetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animalId = Number(id);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // ✅ Vérification d'accès
  useEffect(() => {
    if (!hasPermission('HEALTH_RECORD', 'READ')) {
      Alert.alert(
        "Accès refusé",
        "Vous n'avez pas les droits pour consulter le carnet sanitaire."
      );
      router.replace("/health");
    }
  }, [hasPermission, router]);

  const [carnet, setCarnet] = useState<CarnetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCarnet() {
    setError(null);
    try {
      const response = await api.get(`/health/animals/${animalId}/carnet`);
      setCarnet(response.data.data);
    } catch (err) {
      setError("Erreur de chargement du carnet");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCarnet();
    }, [animalId])
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await fetchCarnet();
    } finally {
      setRefreshing(false);
    }
  }

  const eventsCount = carnet?.events.length ?? 0;
  const lastEventDate = useMemo(() => {
    if (!carnet?.events.length) return null;
    return carnet.events[0]?.date ?? null;
  }, [carnet]);

  const getEventIconName = (type: CarnetEventType): string => {
    switch (type) {
      case "health_record": return "medical";
      case "treatment": return "medkit";
      case "vaccination": return "needle";
      default: return "documents";
    }
  };

  const getEventColor = (type: CarnetEventType) => {
    switch (type) {
      case "health_record": return "#2563eb";
      case "treatment": return "#ea580c";
      case "vaccination": return "#16a34a";
      default: return "#6b7280";
    }
  };

  const getEventTitle = (type: CarnetEventType) => {
    switch (type) {
      case "health_record": return "Diagnostic";
      case "treatment": return "Traitement";
      case "vaccination": return "Vaccination";
      default: return "Événement";
    }
  };

  const formatDate = (date: string | Date) => dateFormatter.format(toDate(date));

  const renderHealthRecord = (data: any) => (
    <View style={styles.detailGrid}>
      <StatusChip label={healthStatusLabels[data.status] || data.status} color={statusColors[data.status] || "#6b7280"} />
      {data.diagnosis && <DetailRow label="Diagnostic" value={data.diagnosis} />}
      {data.symptoms && <DetailRow label="Symptômes" value={data.symptoms} />}
      {data.severity && <DetailRow label="Gravité" value={data.severity} />}
    </View>
  );

  const renderTreatment = (data: any) => (
    <View style={styles.detailGrid}>
      <DetailRow label="Médicament" value={data.medicationName} />
      <DetailRow label="Dosage" value={data.dosage} />
      <DetailRow label="Administration" value={data.administered ? "Administré" : "En cours"} />
      <StatusChip label={data.administered ? "Administré" : "En cours"} color={data.administered ? "#16a34a" : "#ca8a04"} />
    </View>
  );

  const renderVaccination = (data: any) => (
    <View style={styles.detailGrid}>
      <DetailRow label="Vaccin" value={data.vaccineType} />
      {data.batchNumber && <DetailRow label="Lot" value={data.batchNumber} />}
      {data.date && <DetailRow label="Date" value={formatDate(data.date)} />}
      {data.boosterDate && <DetailRow label="Rappel" value={formatDate(data.boosterDate)} />}
      <StatusChip label={statusLabels[data.status] || data.status} color={statusColors[data.status] || "#6b7280"} />
      {data.notes && <DetailRow label="Notes" value={data.notes} />}
    </View>
  );

  const renderEvent = (event: CarnetEvent, index: number) => {
    let content: ReactNode;
    switch (event.type) {
      case "health_record":
        content = renderHealthRecord(event.data);
        break;
      case "treatment":
        content = renderTreatment(event.data);
        break;
      case "vaccination":
        content = renderVaccination(event.data);
        break;
      default:
        content = <Text>Événement inconnu</Text>;
    }

    return (
      <View key={`${event.type}-${event.data.id}-${String(event.date)}`} style={styles.timelineItem}>
        <View style={styles.timelineRail}>
          <View style={[styles.timelineDot, { backgroundColor: getEventColor(event.type) }]} />
          {index !== eventsCount - 1 && <View style={styles.timelineLine} />}
        </View>

        <View style={styles.eventCard}>
          <View style={styles.eventTopBar}>
            <View style={[styles.eventPill, { backgroundColor: getEventColor(event.type) + "18" }]}>
              <Ionicons
                name={getEventIconName(event.type) as any}
                size={14}
                color={getEventColor(event.type)}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.eventPillText, { color: getEventColor(event.type) }]}>{getEventTitle(event.type)}</Text>
            </View>
            <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.eventBody}>{content}</View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (error || !carnet) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "Carnet introuvable."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.headerShell}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerEyebrow}>Carnet sanitaire numérique</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14532d" />}
      >
        <View style={styles.animalCard}>
          <View style={styles.animalAvatarWrap}>
            <Ionicons name="paw" size={34} color="#14532d" />
          </View>
          <View style={styles.animalMeta}>
            <Text style={styles.animalName}>{carnet.animal.name}</Text>
            <Text style={styles.animalSubtle}>RFID {carnet.animal.rfid}</Text>
            <View style={styles.animalPillsRow}>
              <Text style={styles.animalPill}>Race: {carnet.animal.breed}</Text>
              <Text style={styles.animalPill}>{carnet.animal.sex === "MALE" ? "Mâle" : "Femelle"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{eventsCount}</Text>
            <Text style={styles.summaryLabel}>Événements</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{carnet.animal.birthDate ? formatShortDate(carnet.animal.birthDate) : "N/A"}</Text>
            <Text style={styles.summaryLabel}>Naissance</Text>
          </View>
        </View>

        <View style={styles.timelineHeader}>
          <View>
            <Text style={styles.timelineTitle}>Chronologie</Text>
            <Text style={styles.timelineSubtitle}>Du plus récent au plus ancien</Text>
          </View>
          {lastEventDate && <Text style={styles.timelineBadge}>Dernier: {formatDate(lastEventDate)}</Text>}
        </View>

        {carnet.events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="documents" size={42} color="#6b7280" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>Aucun événement médical</Text>
            <Text style={styles.emptySubtext}>Le carnet apparaîtra dès qu'un dossier, traitement ou vaccin est enregistré.</Text>
          </View>
        ) : (
          <View style={styles.timelineWrap}>
            {carnet.events.map((event, index) => renderEvent(event, index))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.statusChip, { backgroundColor: color + "18", borderColor: color + "33" }]}>
      <Text style={[styles.statusChipText, { color }]}>{label}</Text>
    </View>
  );
}

const PAGE_BG = "#f7f6f2";
const GREEN = "#14532d";
const GREEN_DARK = "#0f2a1d";
const BORDER = "#e7e2d8";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },
  headerShell: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 22,
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  headerTextWrap: { flex: 1 },
  headerEyebrow: { fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: "#d7f5e6", opacity: 0.95 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#dc2626" },
  container: { padding: 16, paddingBottom: 24 },

  animalCard: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  animalAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#edf7f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  animalMeta: { flex: 1 },
  animalName: { fontSize: 20, fontWeight: "800", color: GREEN_DARK },
  animalSubtle: { fontSize: 13, color: "#6b7280", marginTop: 3 },
  animalPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  animalPill: {
    fontSize: 12,
    color: GREEN,
    backgroundColor: "#ecf8f1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
    fontWeight: "700",
  },

  summaryRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  summaryValue: { fontSize: 18, fontWeight: "800", color: GREEN_DARK },
  summaryLabel: { fontSize: 12, color: "#6b7280", marginTop: 4 },

  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 18,
    marginBottom: 12,
    gap: 10,
  },
  timelineTitle: { fontSize: 18, fontWeight: "800", color: GREEN_DARK },
  timelineSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  timelineBadge: {
    fontSize: 11,
    color: GREEN,
    backgroundColor: "#ecf8f1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "700",
  },

  timelineWrap: { marginTop: 4 },
  timelineItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  timelineRail: { width: 28, alignItems: "center", paddingTop: 4 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: PAGE_BG, zIndex: 2 },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#d8dfda", marginTop: 4, borderRadius: 2 },

  eventCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  eventTopBar: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  eventPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  eventPillText: { fontSize: 12, fontWeight: "800" },
  eventDate: { fontSize: 11, color: "#6b7280", fontWeight: "600" },
  eventBody: { paddingHorizontal: 14, paddingBottom: 14 },

  detailGrid: { gap: 6 },
  detailRow: { gap: 2 },
  detailLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7280", fontWeight: "700" },
  detailValue: { fontSize: 13, color: "#1f2937", lineHeight: 19 },

  statusChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statusChipText: { fontSize: 12, fontWeight: "800" },

  emptyContainer: {
    backgroundColor: "#fff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 36,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 8,
  },
  emptyText: { fontSize: 16, fontWeight: "800", color: GREEN_DARK },
  emptySubtext: { fontSize: 12, color: "#6b7280", marginTop: 6, textAlign: "center", lineHeight: 18 },
});