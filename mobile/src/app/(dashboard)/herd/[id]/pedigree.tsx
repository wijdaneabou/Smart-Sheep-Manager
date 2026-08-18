import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getPedigree,
  type PedigreeAnimal,
  type PedigreeResult,
  type ConsanguinityAlert,
} from "@/services/animalsService";
import { getBreedInfo, getSexInfo, getHealthStatusInfo } from "@/constants/breeds";
import { API_URL } from "@/services/api";

// ── Design tokens ──────────────────────────────────────────────
const GREEN = "#14532d";
const GREEN_EMERALD = "#059669";
const BACKGROUND = "#f8fafc";
const CARD_BG = "#ffffff";
const BORDER = "#e5e7eb";
const TEXT_DARK = "#1f2937";
const TEXT_MUTED = "#6b7280";

// ── Helpers ────────────────────────────────────────────────────
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function getPhotoUrl(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  return photoUrl.startsWith("http") ? photoUrl : `${API_URL}${photoUrl}`;
}

// ── Main component ─────────────────────────────────────────────
export default function PedigreeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animalId = Number(id);
  const router = useRouter();

  const [data, setData] = useState<PedigreeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPedigree() {
    setError(null);
    const result = await getPedigree(animalId);
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPedigree().finally(() => setLoading(false));
    }, [animalId])
  );

  function handleNodePress(animal: PedigreeAnimal | null) {
    if (!animal) return;
    router.push(`/herd/${animal.id}` as any);
  }

  // ── Loading state ──
  if (loading) {
    return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
        </Pressable>
      </View>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GREEN_EMERALD} />
      </View>
    </SafeAreaView>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
        </Pressable>
      </View>
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#dc2626" />
        <Text style={styles.error}>{error ?? "Aucune donnée."}</Text>
      </View>
    </SafeAreaView>
    );
  }

  const { tree, consanguinityAlerts, hasConsanguinity } = data;
  const subject = tree.animal;
  const breedInfo = subject ? getBreedInfo(subject.breed) : { icon: "🐑", label: "Inconnu" };
  const subjectPhotoUrl = subject ? getPhotoUrl(subject.photoUrl) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Subject header ── */}
        <View style={styles.subjectHeader}>
          <AnimalAvatar
            photoUrl={subjectPhotoUrl}
            breedIcon={breedInfo.icon}
            size={80}
          />
          <Text style={styles.subjectName}>{subject ? subject.name : "—"}</Text>
          {subject && (
            <Text style={styles.subjectRfid}>{subject.rfid}</Text>
          )}
        </View>

        {/* ── Consanguinity alert ── */}
        {hasConsanguinity && (
          <View style={styles.alertContainer}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={20} color="#92400e" />
              <Text style={styles.alertTitle}>Alerte de consanguinité</Text>
            </View>
            <Text style={styles.alertText}>
              Des ancêtres communs ont été détectés dans l'arbre. Cela peut
              augmenter le risque de consanguinité.
            </Text>
            {consanguinityAlerts.map((alert) => (
              <View key={alert.animalId} style={styles.alertDetail}>
                <Text style={styles.alertDetailName}>{alert.animalName}</Text>
                <Text style={styles.alertDetailText}>
                  Apparaît {alert.occurrences} fois dans l'arbre
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Tree visualization ── */}
        <View style={styles.treeContainer}>
          {/* Generation 2: Grandparents */}
          <View style={styles.generationRow}>
            <Gen2Node
              animal={tree.father?.father?.animal ?? null}
              relationship="Grand-père paternel"
              onPress={handleNodePress}
            />
            <Gen2Node
              animal={tree.father?.mother?.animal ?? null}
              relationship="Grand-mère paternelle"
              onPress={handleNodePress}
            />
            <Gen2Node
              animal={tree.mother?.father?.animal ?? null}
              relationship="Grand-père maternel"
              onPress={handleNodePress}
            />
            <Gen2Node
              animal={tree.mother?.mother?.animal ?? null}
              relationship="Grand-mère maternelle"
              onPress={handleNodePress}
            />
          </View>

          {/* Connector: Gen 2 → Gen 1 */}
          <View style={styles.connectorContainer}>
            <View style={styles.connectorHalf}>
              {renderConnector(tree.father?.father?.animal, tree.father?.mother?.animal)}
              <View style={styles.connectorVertical} />
            </View>
            <View style={styles.connectorHalf}>
              {renderConnector(tree.mother?.father?.animal, tree.mother?.mother?.animal)}
              <View style={styles.connectorVertical} />
            </View>
          </View>

          {/* Generation 1: Parents */}
          <View style={styles.generationRow}>²²²²²
            <Gen1Node
              animal={tree.father?.animal ?? null}
              relationship="Père"
              onPress={handleNodePress}
            />
            <Gen1Node
              animal={tree.mother?.animal ?? null}
              relationship="Mère"
              onPress={handleNodePress}
            />
          </View>

          {/* Connector: Gen 1 → Gen 0 */}
          <View style={styles.connectorContainer}>
            <View style={styles.connectorHalf}>
              <View style={styles.connectorVertical} />
            </View>
            <View style={styles.connectorHalf}>
              <View style={styles.connectorVertical} />
            </View>
          </View>

          {/* Generation 0: Subject */}
          <View style={styles.generationRow}>
            <Gen0Node
              animal={tree.animal}
              relationship="Sujet"
              onPress={handleNodePress}
            />
          </View>
        </View>

        {/* ── Legend ── */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Légende</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <Ionicons name="male" size={14} color="#3b82f6" />
              <Text style={styles.legendLabel}>Mâle</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="female" size={14} color="#ec4899" />
              <Text style={styles.legendLabel}>Femelle</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
              <Text style={styles.legendLabel}>En santé</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="warning" size={14} color="#d97706" />
              <Text style={styles.legendLabel}>Consanguinité</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function AnimalAvatar({
  photoUrl,
  breedIcon,
  size,
}: {
  photoUrl: string | null;
  breedIcon: string;
  size: number;
}) {
  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.4 }}>{breedIcon}</Text>
    </View>
  );
}

/**
 * Renders a connector line between two parents (grandparents) converging
 * toward their child. Returns null if both parents are unknown.
 */
function renderConnector(
  father: PedigreeAnimal | null | undefined,
  mother: PedigreeAnimal | null | undefined
) {
  if (!father && !mother) {
    return <View style={styles.connectorNone} />;
  }
  return <View style={styles.connectorDiagonal} />;
}

/**
 * Generation 2 node (grandparent) — card with photo and readable info.
 */
function Gen2Node({
  animal,
  relationship,
  onPress,
}: {
  animal: PedigreeAnimal | null;
  relationship: string;
  onPress: (animal: PedigreeAnimal | null) => void;
}) {
  const photoUrl = animal ? getPhotoUrl(animal.photoUrl) : null;
  const breedInfo = animal ? getBreedInfo(animal.breed) : { icon: "🐑", label: "Inconnu" };
  const sexInfo = animal ? getSexInfo(animal.sex) : { icon: "❓", label: "?", id: "" };

  return (
    <Pressable
      style={styles.gen2Card}
      onPress={() => onPress(animal)}
      disabled={!animal}
    >
      <View
        style={[
          styles.gen2CardInner,
          !animal && styles.cardUnknown,
          animal && animal.sex === "MALE"
            ? styles.cardMale
            : animal && styles.cardFemale,
        ]}
      >
        {animal ? (
          <>
            <AnimalAvatar photoUrl={photoUrl} breedIcon={breedInfo.icon} size={36} />
            <Text style={styles.gen2Name} numberOfLines={1}>
              {animal.name}
            </Text>
            <Text style={styles.gen2Rfid} numberOfLines={1}>
              {animal.rfid}
            </Text>
            <View style={styles.gen2Badge}>
              <Text style={styles.gen2Sex}>
                {sexInfo.icon}
              </Text>
            </View>
          </>
        ) : (
          <>
            <AnimalAvatar photoUrl={null} breedIcon="❓" size={36} />
            <Text style={styles.gen2Name}>Inconnu</Text>
          </>
        )}
      </View>
      <Text style={styles.relationshipLabel}>{relationship}</Text>
    </Pressable>
  );
}

/**
 * Generation 1 node (parent) — medium card with photo and readable info.
 */
function Gen1Node({
  animal,
  relationship,
  onPress,
}: {
  animal: PedigreeAnimal | null;
  relationship: string;
  onPress: (animal: PedigreeAnimal | null) => void;
}) {
  const photoUrl = animal ? getPhotoUrl(animal.photoUrl) : null;
  const breedInfo = animal ? getBreedInfo(animal.breed) : { icon: "🐑", label: "Inconnu" };
  const sexInfo = animal ? getSexInfo(animal.sex) : { icon: "❓", label: "?", id: "" };
  const healthInfo = animal
    ? getHealthStatusInfo(animal.healthStatus)
    : { icon: "❓", label: "?", color: "#666" };

  return (
    <Pressable
      style={styles.gen1Card}
      onPress={() => onPress(animal)}
      disabled={!animal}
    >
      <View
        style={[
          styles.gen1CardInner,
          !animal && styles.cardUnknown,
          animal && animal.sex === "MALE"
            ? styles.cardMale
            : animal && styles.cardFemale,
        ]}
      >
        {animal ? (
          <>
            <AnimalAvatar photoUrl={photoUrl} breedIcon={breedInfo.icon} size={44} />
            <Text style={styles.gen1Name} numberOfLines={1}>
              {animal.name}
            </Text>
            <Text style={styles.gen1Rfid} numberOfLines={1}>
              {animal.rfid}
            </Text>
            <View style={styles.gen1Badges}>
              <View
                style={[
                  styles.gen1SexBadge,
                  { backgroundColor: animal.sex === "MALE" ? "#dbeafe" : "#fce7f3" },
                ]}
              >
                <Text style={styles.gen1Sex}>
                  {sexInfo.icon} {sexInfo.label}
                </Text>
              </View>
              <View
                style={[
                  styles.gen1HealthBadge,
                  {
                    backgroundColor: healthInfo.color + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.gen1Health,
                    { color: healthInfo.color },
                  ]}
                >
                  {healthInfo.icon}
                </Text>
              </View>
            </View>
            {animal.birthDate && (
              <Text style={styles.gen1BirthDate}>
                Né(e) le {formatDate(animal.birthDate)}
              </Text>
            )}
          </>
        ) : (
          <>
            <AnimalAvatar photoUrl={null} breedIcon="❓" size={44} />
            <Text style={styles.gen1Name}>Inconnu</Text>
          </>
        )}
      </View>
      <Text style={styles.relationshipLabel}>{relationship}</Text>
    </Pressable>
  );
}

/**
 * Generation 0 node (subject) — largest card, highlighted, with photo.
 */
function Gen0Node({
  animal,
  relationship,
  onPress,
}: {
  animal: PedigreeAnimal | null;
  relationship: string;
  onPress: (animal: PedigreeAnimal | null) => void;
}) {
  const photoUrl = animal ? getPhotoUrl(animal.photoUrl) : null;
  const breedInfo = animal ? getBreedInfo(animal.breed) : { icon: "🐑", label: "Inconnu" };
  const sexInfo = animal ? getSexInfo(animal.sex) : { icon: "❓", label: "?", id: "" };
  const healthInfo = animal
    ? getHealthStatusInfo(animal.healthStatus)
    : { icon: "❓", label: "?", color: "#666" };

  return (
    <Pressable
      style={styles.gen0Card}
      onPress={() => onPress(animal)}
      disabled={!animal}
    >
      <View
        style={[
          styles.gen0CardInner,
          !animal && styles.cardUnknown,
          animal && animal.sex === "MALE"
            ? styles.cardMale
            : animal && styles.cardFemale,
          styles.gen0Highlight,
        ]}
      >
        {animal ? (
          <>
            <AnimalAvatar photoUrl={photoUrl} breedIcon={breedInfo.icon} size={60} />
            <Text style={styles.gen0Name}>{animal.name}</Text>
            <Text style={styles.gen0Rfid}>{animal.rfid}</Text>
            <View style={styles.gen0Badges}>
              <View
                style={[
                  styles.gen0Badge,
                  { backgroundColor: animal.sex === "MALE" ? "#dbeafe" : "#fce7f3" },
                ]}
              >
                <Text style={styles.gen0BadgeText}>
                  {sexInfo.icon} {sexInfo.label}
                </Text>
              </View>
              <View
                style={[
                  styles.gen0Badge,
                  {
                    backgroundColor: healthInfo.color + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.gen0BadgeText,
                    { color: healthInfo.color },
                  ]}
                >
                  {healthInfo.icon} {healthInfo.label}
                </Text>
              </View>
            </View>
            {animal.birthDate && (
              <Text style={styles.gen0BirthDate}>
                Né(e) le {formatDate(animal.birthDate)}
              </Text>
            )}
            {animal.weight && (
              <Text style={styles.gen0Weight}>
                {animal.weight} kg · BCS {animal.bcs ?? "—"}
              </Text>
            )}
          </>
        ) : (
          <>
            <AnimalAvatar photoUrl={null} breedIcon="❓" size={60} />
            <Text style={styles.gen0Name}>Inconnu</Text>
          </>
        )}
      </View>
      <Text style={styles.relationshipLabel}>{relationship}</Text>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const MALE_BORDER = "#3b82f6";
const FEMALE_BORDER = "#ec4899";
const UNKNOWN_BG = "#f3f4f6";

const styles = StyleSheet.create({
  // ── Layout ──
  safeArea: { flex: 1, backgroundColor: BACKGROUND },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Subject header ──
  subjectHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: "800",
    color: GREEN,
    marginTop: 8,
  },
  subjectRfid: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },

  // ── Consanguinity alert ──
  alertContainer: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400e",
  },
  alertText: {
    fontSize: 12,
    color: "#78350f",
    lineHeight: 17,
    marginBottom: 8,
  },
  alertDetail: {
    backgroundColor: CARD_BG,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  alertDetailName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#78350f",
  },
  alertDetailText: {
    fontSize: 11,
    color: "#92400e",
  },

  // ── Tree ──
  treeContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  generationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  // ── Gen 2 cards (grandparents) ──
  gen2Card: {
    flex: 1,
    alignItems: "center",
  },
  gen2CardInner: {
    width: "100%",
    backgroundColor: CARD_BG,
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    height: 120,
    justifyContent: "center",
  },
  gen2Name: {
    fontSize: 10,
    fontWeight: "700",
    color: TEXT_DARK,
    textAlign: "center",
    marginTop: 4,
  },
  gen2Rfid: {
    fontSize: 7,
    color: TEXT_MUTED,
    textAlign: "center",
    marginTop: 1,
  },
  gen2Badge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
  },
  gen2Sex: {
    fontSize: 10,
  },

  // ── Gen 1 cards (parents) ──
  gen1Card: {
    flex: 1,
    alignItems: "center",
  },
  gen1CardInner: {
    width: "100%",
    backgroundColor: CARD_BG,
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    height: 160,
    justifyContent: "center",
  },
  gen1Name: {
    fontSize: 12,
    fontWeight: "700",
    color: TEXT_DARK,
    textAlign: "center",
    marginTop: 4,
  },
  gen1Rfid: {
    fontSize: 8,
    color: TEXT_MUTED,
    textAlign: "center",
    marginTop: 1,
  },
  gen1Badges: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  gen1SexBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gen1Sex: {
    fontSize: 9,
    fontWeight: "600",
  },
  gen1HealthBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gen1Health: {
    fontSize: 10,
  },
  gen1BirthDate: {
    fontSize: 8,
    color: TEXT_MUTED,
    marginTop: 4,
    textAlign: "center",
  },

  // ── Gen 0 card (subject) ──
  gen0Card: {
    alignItems: "center",
  },
  gen0CardInner: {
    width: 160,
    backgroundColor: CARD_BG,
    borderWidth: 3,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    height: 200,
    justifyContent: "center",
  },
  gen0Highlight: {
    shadowColor: GREEN_EMERALD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  gen0Name: {
    fontSize: 14,
    fontWeight: "800",
    color: GREEN,
    textAlign: "center",
    marginTop: 6,
  },
  gen0Rfid: {
    fontSize: 9,
    color: TEXT_MUTED,
    textAlign: "center",
    marginTop: 2,
  },
  gen0Badges: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  gen0Badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gen0BadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  gen0BirthDate: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginTop: 4,
    textAlign: "center",
  },
  gen0Weight: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },

  // ── Shared card states ──
  cardMale: {
    borderColor: MALE_BORDER,
  },
  cardFemale: {
    borderColor: FEMALE_BORDER,
  },
  cardUnknown: {
    backgroundColor: UNKNOWN_BG,
    borderColor: "#ccc",
  },

  // ── Relationship label ──
  relationshipLabel: {
    fontSize: 10,
    color: TEXT_MUTED,
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },

  // ── Connectors ──
  connectorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 30,
    marginTop: 4,
    marginBottom: 4,
  },
  connectorHalf: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  connectorVertical: {
    width: 2,
    height: 20,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
  },
  connectorDiagonal: {
    width: 2,
    height: 14,
    backgroundColor: "#93c5fd",
    alignSelf: "center",
    transform: [{ rotate: "12deg" }],
    marginBottom: 3,
  },
  connectorNone: {
    width: 2,
    height: 14,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 3,
  },

  // ── Legend ──
  legendContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
});
