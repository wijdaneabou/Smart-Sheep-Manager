import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  getPedigree,
  type PedigreeAnimal,
  type PedigreeNode,
  type PedigreeResult,
  type ConsanguinityAlert,
} from "@/services/animalsService";
import { getBreedInfo, getSexInfo, getHealthStatusInfo } from "@/constants/breeds";

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Arbre généalogique</Text>
          <View style={{ width: 32 }} />
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
          <Text style={styles.headerTitle}>Arbre généalogique</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "Aucune donnée."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { tree, consanguinityAlerts, hasConsanguinity } = data;
  const subject = tree.animal;
  const breedInfo = subject ? getBreedInfo(subject.breed) : { icon: "🐑", label: "Inconnu" };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Arbre généalogique</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subject header */}
        <View style={styles.subjectHeader}>
          <Text style={styles.subjectIcon}>{breedInfo.icon}</Text>
          <Text style={styles.subjectName}>{subject ? subject.name : "—"}</Text>
          {subject && (
            <Text style={styles.subjectRfid}>{subject.rfid}</Text>
          )}
        </View>

        {/* Consanguinity alert */}
        {hasConsanguinity && (
          <View style={styles.alertContainer}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertIcon}>⚠️</Text>
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

        {/* Tree visualization */}
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
          <View style={styles.generationRow}>
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

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Légende</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>♂️</Text>
              <Text style={styles.legendLabel}>Mâle</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>♀️</Text>
              <Text style={styles.legendLabel}>Femelle</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>✅</Text>
              <Text style={styles.legendLabel}>En santé</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>⚠️</Text>
              <Text style={styles.legendLabel}>Consanguinité</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
 * Generation 2 node (grandparent) — smallest card.
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
            <Text style={styles.gen2Icon}>{getBreedInfo(animal.breed).icon}</Text>
            <Text style={styles.gen2Name} numberOfLines={1}>
              {animal.name}
            </Text>
            <Text style={styles.gen2Rfid} numberOfLines={1}>
              {animal.rfid}
            </Text>
            <View style={styles.gen2Badge}>
              <Text style={styles.gen2Sex}>
                {getSexInfo(animal.sex).icon}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.gen2Icon}>❓</Text>
            <Text style={styles.gen2Name}>Inconnu</Text>
          </>
        )}
      </View>
      <Text style={styles.relationshipLabel}>{relationship}</Text>
    </Pressable>
  );
}

/**
 * Generation 1 node (parent) — medium card.
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
            <Text style={styles.gen1Icon}>{getBreedInfo(animal.breed).icon}</Text>
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
                  {getSexInfo(animal.sex).icon} {getSexInfo(animal.sex).label}
                </Text>
              </View>
              <View
                style={[
                  styles.gen1HealthBadge,
                  {
                    backgroundColor: getHealthStatusInfo(animal.healthStatus).color + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.gen1Health,
                    { color: getHealthStatusInfo(animal.healthStatus).color },
                  ]}
                >
                  {getHealthStatusInfo(animal.healthStatus).icon}
                </Text>
              </View>
            </View>
            {animal.birthDate && (
              <Text style={styles.gen1BirthDate}>
                Né(e) le {new Date(animal.birthDate).toLocaleDateString("fr-FR")}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.gen1Icon}>❓</Text>
            <Text style={styles.gen1Name}>Inconnu</Text>
          </>
        )}
      </View>
      <Text style={styles.relationshipLabel}>{relationship}</Text>
    </Pressable>
  );
}

/**
 * Generation 0 node (subject) — largest card, highlighted.
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
            <Text style={styles.gen0Icon}>{getBreedInfo(animal.breed).icon}</Text>
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
                  {getSexInfo(animal.sex).icon} {getSexInfo(animal.sex).label}
                </Text>
              </View>
              <View
                style={[
                  styles.gen0Badge,
                  {
                    backgroundColor: getHealthStatusInfo(animal.healthStatus).color + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.gen0BadgeText,
                    { color: getHealthStatusInfo(animal.healthStatus).color },
                  ]}
                >
                  {getHealthStatusInfo(animal.healthStatus).icon}{" "}
                  {getHealthStatusInfo(animal.healthStatus).label}
                </Text>
              </View>
            </View>
            {animal.birthDate && (
              <Text style={styles.gen0BirthDate}>
                Né(e) le {new Date(animal.birthDate).toLocaleDateString("fr-FR")}
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
            <Text style={styles.gen0Icon}>❓</Text>
            <Text style={styles.gen0Name}>Inconnu</Text>
          </>
        )}
      </View>
      <Text style={styles.relationshipLabel}>{relationship}</Text>
    </Pressable>
  );
}

const PAGE_BG = "#faf3ea";
const MALE_BORDER = "#3b82f6";
const FEMALE_BORDER = "#ec4899";
const UNKNOWN_BG = "#f3f4f6";

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

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  error: { color: "#dc2626", fontSize: 14, textAlign: "center" },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // ── Subject header ──
  subjectHeader: { alignItems: "center", marginBottom: 20 },
  subjectIcon: { fontSize: 42, marginBottom: 6 },
  subjectName: { fontSize: 20, fontWeight: "800", color: "#0F2A1D" },
  subjectRfid: { fontSize: 12, color: "#888", marginTop: 2 },

  // ── Consanguinity alert ──
  alertContainer: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  alertIcon: { fontSize: 20 },
  alertTitle: { fontSize: 14, fontWeight: "700", color: "#92400e" },
  alertText: { fontSize: 12, color: "#78350f", lineHeight: 17, marginBottom: 8 },
  alertDetail: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  alertDetailName: { fontSize: 12, fontWeight: "700", color: "#78350f" },
  alertDetailText: { fontSize: 11, color: "#92400e" },

  // ── Tree ──
  treeContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },

  generationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  // ── Gen 2 cards (grandparents) ──
  gen2Card: { flex: 1, alignItems: "center" },
  gen2CardInner: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    aspectRatio: 1,
    justifyContent: "center",
  },
  gen2Icon: { fontSize: 22, marginBottom: 2 },
  gen2Name: { fontSize: 10, fontWeight: "700", color: "#333", textAlign: "center" },
  gen2Rfid: { fontSize: 7, color: "#999", textAlign: "center", marginTop: 1 },
  gen2Badge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
  },
  gen2Sex: { fontSize: 10 },

  // ── Gen 1 cards (parents) ──
  gen1Card: { flex: 1, alignItems: "center" },
  gen1CardInner: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    aspectRatio: 1.2,
    justifyContent: "center",
  },
  gen1Icon: { fontSize: 26, marginBottom: 4 },
  gen1Name: { fontSize: 12, fontWeight: "700", color: "#333", textAlign: "center" },
  gen1Rfid: { fontSize: 8, color: "#999", textAlign: "center", marginTop: 1 },
  gen1Badges: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  gen1SexBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gen1Sex: { fontSize: 9, fontWeight: "600" },
  gen1HealthBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gen1Health: { fontSize: 10 },
  gen1BirthDate: { fontSize: 8, color: "#888", marginTop: 2, textAlign: "center" },

  // ── Gen 0 card (subject) ──
  gen0Card: { alignItems: "center" },
  gen0CardInner: {
    width: 140,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    aspectRatio: 1,
    justifyContent: "center",
  },
  gen0Highlight: {
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  gen0Icon: { fontSize: 32, marginBottom: 4 },
  gen0Name: { fontSize: 14, fontWeight: "800", color: "#0F2A1D", textAlign: "center" },
  gen0Rfid: { fontSize: 9, color: "#888", textAlign: "center", marginTop: 2 },
  gen0Badges: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  gen0Badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gen0BadgeText: { fontSize: 9, fontWeight: "600" },
  gen0BirthDate: { fontSize: 9, color: "#888", marginTop: 4, textAlign: "center" },
  gen0Weight: { fontSize: 9, color: "#666", marginTop: 2, textAlign: "center" },

  // ── Shared card states ──
  cardMale: { borderColor: MALE_BORDER },
  cardFemale: { borderColor: FEMALE_BORDER },
  cardUnknown: { backgroundColor: UNKNOWN_BG, borderColor: "#ccc" },

  // ── Relationship label ──
  relationshipLabel: {
    fontSize: 10,
    color: "#666",
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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  legendTitle: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
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
  legendIcon: { fontSize: 14 },
  legendLabel: { fontSize: 11, color: "#555" },
});
