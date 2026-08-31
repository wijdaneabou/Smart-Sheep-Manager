import { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Link, useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { usePermissions } from "@/contexts/PermissionsContext";
import * as ImagePicker from "expo-image-picker";
import {
  getUserById,
  deactivateUser,
  reactivateUser,
  uploadUserPhoto,
  type User,
} from "../../../../services/userService";

// ADAPTER : remplacez par la vraie baseURL utilisee dans services/api.ts
const API_ORIGIN = "http://192.168.1.12:3000";

const GREEN = "#14532d";
const GREEN_LIGHT = "#DCFCE7";
const CREAM = "#f5f5f0";

const ROLE_LABELS: Record<number, string> = {
  1: "Administrateur",
  2: "Gestionnaire",
  3: "Éleveur",
};

export default function UserProfileScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function fetchUser() {
    setError(null);
    const result = await getUserById(userId);
    if (result.success) {
      setUser(result.user);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      fetchUser().finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])
  );

  async function handleToggleStatus() {
    if (!user) return;
    setActionLoading(true);
    const result =
      user.status === "ACTIVE"
        ? await deactivateUser(user.id)
        : await reactivateUser(user.id);
    setActionLoading(false);

    if (result.success) {
      setUser(result.user);
    } else {
      Alert.alert("Erreur", result.message);
    }
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission requise",
        "Autorisez l'accès aux photos pour changer la photo de profil."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingPhoto(true);
    const uploadResult = await uploadUserPhoto(userId, result.assets[0].uri);
    setUploadingPhoto(false);

    if (uploadResult.success) {
      setUser(uploadResult.user);
    } else {
      Alert.alert("Erreur", uploadResult.message);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="#dc2626" style={{ marginBottom: 10 }} />
          <Text style={styles.errorText}>{error ?? "Utilisateur introuvable."}</Text>
          <Pressable style={styles.retryButton} onPress={fetchUser}>
            <Text style={styles.retryButtonText}>RÉESSAYER</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = user.status === "ACTIVE";
  const roleLabel = ROLE_LABELS[user.roleId] ?? `Rôle #${user.roleId}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={GREEN} />
        </Pressable>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Bandeau vert type "prairie" avec avatar en médaillon */}
        <View style={styles.heroCard}>
          <View style={styles.heroBanner}>
            <Ionicons name="leaf-outline" size={16} color="rgba(255,255,255,0.55)" style={styles.leafIcon1} />
            <Ionicons name="leaf-outline" size={20} color="rgba(255,255,255,0.35)" style={styles.leafIcon2} />
          </View>

          <Pressable onPress={handlePickPhoto} style={styles.avatarWrapper}>
            {user.photo ? (
              <Image
                source={{ uri: `${API_ORIGIN}${user.photo}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>
                  {user.firstName[0]}
                  {user.lastName[0]}
                </Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="camera" size={14} color="#fff" />
              )}
            </View>
          </Pressable>

          <Text style={styles.name}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Ionicons name="ribbon-outline" size={13} color={GREEN} />
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: isActive ? "#15803D" : "#DC2626" }]} />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isActive ? "#15803D" : "#DC2626" },
                ]}
              >
                {isActive ? "Compte actif" : "Compte désactivé"}
              </Text>
            </View>
          </View>
        </View>

        {/* Informations */}
        <View style={styles.section}>
          <SectionHeader icon="information-circle-outline" label="Informations" />
          <InfoRow icon="call-outline" label="Téléphone" value={user.phone || "—"} />
          <InfoRow icon="shield-checkmark-outline" label="Rôle" value={roleLabel} />
          <InfoRow
            icon="business-outline"
            label="Exploitation"
            value={user.exploitationId ? `Exploitation #${user.exploitationId}` : "Non assignée"}
          />
          <InfoRow
            icon="calendar-outline"
            label="Membre depuis"
            value={new Date(user.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            isLast
          />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <SectionHeader icon="settings-outline" label="Actions" />

          {hasPermission("USERS", "UPDATE") && (
            <Link
              href={{ pathname: "/users/[id]/edit", params: { id: String(user.id) } }}
              asChild
            >
              <Pressable style={styles.actionRow}>
                <View style={[styles.actionIconCircle, { backgroundColor: "#EFF6FF" }]}>
                  <Feather name="edit-2" size={16} color="#2563EB" />
                </View>
                <Text style={styles.actionLabel}>Modifier le profil</Text>
                <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
              </Pressable>
            </Link>
          )}

          <Link
            href={{ pathname: "/users/[id]/admin-detail", params: { id: String(user.id) } }}
            asChild
          >
            <Pressable style={styles.actionRow}>
              <View style={[styles.actionIconCircle, { backgroundColor: "#F5F3FF" }]}>
                <Ionicons name="git-network-outline" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.actionLabel}>Vue admin — exploitations & animaux</Text>
              <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
            </Pressable>
          </Link>

          <Link
            href={{
              pathname: "/users/[id]/login-history",
              params: { id: String(user.id) },
            }}
            asChild
          >
            <Pressable style={styles.actionRow}>
              <View style={[styles.actionIconCircle, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="time-outline" size={16} color={GREEN} />
              </View>
              <Text style={styles.actionLabel}>Historique des connexions</Text>
              <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
            </Pressable>
          </Link>

          {hasPermission("USERS", "DELETE") && (
            <Pressable
              style={[styles.actionRow, styles.actionRowLast]}
              onPress={handleToggleStatus}
              disabled={actionLoading}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: isActive ? "#FEF2F2" : "#ECFDF5" },
                ]}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={isActive ? "#DC2626" : GREEN} />
                ) : (
                  <Ionicons
                    name={isActive ? "close-circle-outline" : "checkmark-circle-outline"}
                    size={16}
                    color={isActive ? "#DC2626" : GREEN}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.actionLabel,
                  { color: isActive ? "#DC2626" : GREEN },
                ]}
              >
                {isActive ? "Désactiver le compte" : "Réactiver le compte"}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={GREEN} />
      <Text style={styles.sectionHeaderText}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <View style={styles.infoIconCircle}>
        <Ionicons name={icon} size={15} color={GREEN} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CREAM },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  errorText: { color: "#dc2626", fontSize: 14, textAlign: "center", marginBottom: 16 },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  container: { padding: 16, paddingBottom: 40 },

  // Hero
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    paddingBottom: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  heroBanner: {
    width: "100%",
    height: 64,
    backgroundColor: GREEN,
  },
  leafIcon1: { position: "absolute", top: 10, right: 24, transform: [{ rotate: "20deg" }] },
  leafIcon2: { position: "absolute", top: 30, right: 60, transform: [{ rotate: "-15deg" }] },
  avatarWrapper: { marginTop: -40, marginBottom: 12 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#ddd",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: GREEN_LIGHT },
  avatarInitials: { fontSize: 26, fontWeight: "800", color: GREEN },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: { fontSize: 19, fontWeight: "800", color: "#111", marginTop: 2 },
  email: { fontSize: 13, color: "#888", marginTop: 2, marginBottom: 14 },

  badgeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: GREEN },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeActive: { backgroundColor: "#F0FDF4" },
  statusBadgeInactive: { backgroundColor: "#FEF2F2" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },

  // Sections
  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionHeaderText: { fontSize: 13, fontWeight: "700", color: "#1f2937", textTransform: "uppercase", letterSpacing: 0.3 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoLabel: { fontSize: 13, color: "#666", fontWeight: "600", flex: 1 },
  infoValue: { fontSize: 13, fontWeight: "700", color: "#111" },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  actionRowLast: { borderBottomWidth: 0 },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionLabel: { fontSize: 14, fontWeight: "600", color: "#1f2937", flex: 1 },
});