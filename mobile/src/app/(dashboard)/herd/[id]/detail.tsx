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
import { useLocalSearchParams, useRouter, useFocusEffect, Link } from "expo-router";
import {
  getAnimalById,
  deleteAnimal,
  type Animal,
} from "../../../../services/animalsService";
import { getBreedInfo, getSexInfo, getHealthStatusInfo } from "../../../../constants/breeds";

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animalId = Number(id);
  const router = useRouter();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchAnimal() {
    setError(null);
    const result = await getAnimalById(animalId);
    if (result.success) {
      setAnimal(result.animal);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAnimal().finally(() => setLoading(false));
    }, [animalId])
  );

  async function handleDelete() {
    Alert.alert(
      "Confirmer la suppression",
      `Êtes-vous sûr de vouloir supprimer ${animal?.name} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const result = await deleteAnimal(animalId);
            setDeleting(false);
            if (result.success) {
              router.back();
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (error || !animal) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "Animal introuvable."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const breedInfo = getBreedInfo(animal.breed);
  const sexInfo = getSexInfo(animal.sex);
  const healthInfo = getHealthStatusInfo(animal.healthStatus);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Fiche Animal</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* En-tête avec icône et nom */}
        <View style={styles.animalHeader}>
          <Text style={styles.animalIcon}>{breedInfo.icon}</Text>
          <Text style={styles.animalName}>{animal.name}</Text>
          <View
            style={[
              styles.healthBadge,
              { backgroundColor: healthInfo.color + "20" },
            ]}
          >
            <Text style={[styles.healthBadgeText, { color: healthInfo.color }]}>
              {healthInfo.icon} {healthInfo.label}
            </Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsRow}>
          <Link
            href={{
              pathname: "/herd/[id]/edit",
              params: { id: String(animal.id) },
            }}
            asChild
          >
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionLabel}>Modifier</Text>
            </Pressable>
          </Link>
          <Pressable
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <>
                <Text style={styles.actionIcon}>🗑️</Text>
                <Text style={[styles.actionLabel, { color: "#dc2626" }]}>Supprimer</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => {}}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionLabel}>Exporter</Text>
          </Pressable>
        </View>

        {/* Informations complètes */}
        <View style={styles.infoBlock}>
          <SectionTitle label="Identité" />
          <InfoRow label="RFID" value={animal.rfid} />
          <InfoRow label="Nom" value={animal.name} />
          <InfoRow label="Race" value={breedInfo.label} />
          <InfoRow
            label="Sexe"
            value={`${sexInfo.icon} ${sexInfo.label}`}
          />
          <InfoRow
            label="Statut santé"
            value={`${healthInfo.icon} ${healthInfo.label}`}
            last
          />
        </View>

        <View style={styles.infoBlock}>
          <SectionTitle label="Caractéristiques" />
          <InfoRow
            label="Date de naissance"
            value={
              animal.birthDate
                ? new Date(animal.birthDate).toLocaleDateString("fr-FR")
                : "—"
            }
          />
          <InfoRow
            label="Poids"
            value={animal.weight ? `${animal.weight} kg` : "—"}
          />
          <InfoRow label="BCS" value={animal.bcs ?? "—"} />
          <InfoRow label="Créé le" value={new Date(animal.createdAt).toLocaleDateString("fr-FR")} last />
        </View>

        <View style={styles.infoBlock}>
          <SectionTitle label="Pedigree" />
          <InfoRow
            label="Père (ID)"
            value={animal.fatherId ? String(animal.fatherId) : "Non renseigné"}
          />
          <InfoRow
            label="Mère (ID)"
            value={animal.motherId ? String(animal.motherId) : "Non renseigné"}
          />
          <InfoRow
            label="Exploitation (ID)"
            value={animal.exploitationId ? String(animal.exploitationId) : "Non renseignée"}
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleContainer}>
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  headerTitle: { fontSize: 16, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#dc2626" },

  container: { padding: 20, paddingTop: 8 },

  animalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  animalIcon: { fontSize: 48, marginBottom: 8 },
  animalName: { fontSize: 22, fontWeight: "800", color: "#0F2A1D", marginBottom: 8 },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  healthBadgeText: { fontSize: 12, fontWeight: "700" },

  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  actionButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  actionButtonDanger: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  actionIcon: { fontSize: 16, marginBottom: 4 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#333" },

  infoBlock: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitleContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: { fontSize: 13, color: "#888" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#333" },
});
