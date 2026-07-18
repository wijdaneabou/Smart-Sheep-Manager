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

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const router = useRouter();

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
      setLoading(true);
      fetchUser().finally(() => setLoading(false));
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
        "Autorisez l'acces aux photos pour changer la photo de profil."
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
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  if (error || !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? "Utilisateur introuvable."}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
            <Text style={styles.avatarBadgeText}>Modifier</Text>
          )}
        </View>
      </Pressable>

      <Text style={styles.name}>
        {user.firstName} {user.lastName}
      </Text>
      <Text style={styles.email}>{user.email}</Text>

      <Text
        style={[
          styles.badge,
          user.status === "ACTIVE" ? styles.badgeActive : styles.badgeInactive,
        ]}
      >
        {user.status}
      </Text>

      <View style={styles.infoBlock}>
        <InfoRow label="Telephone" value={user.phone || "—"} />
        <InfoRow label="Role (ID)" value={String(user.roleId)} />
        <InfoRow
          label="Exploitation (ID)"
          value={user.exploitationId ? String(user.exploitationId) : "Non assignee"}
        />
        <InfoRow
          label="Cree le"
          value={new Date(user.createdAt).toLocaleDateString("fr-FR")}
        />
      </View>

      <View style={styles.actions}>
        <Link
          href={{ pathname: "/users/[id]/edit", params: { id: String(user.id) } }}
          asChild
        >
          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </Pressable>
        </Link>

        <Pressable
          style={styles.toggleButton}
          onPress={handleToggleStatus}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.toggleButtonText}>
              {user.status === "ACTIVE" ? "Desactiver le compte" : "Reactiver le compte"}
            </Text>
          )}
        </Pressable>

        <Link
          href={{
            pathname: "/users/[id]/login-history",
            params: { id: String(user.id) },
          }}
          asChild
        >
          <Pressable style={styles.historyButton}>
            <Text style={styles.historyButtonText}>Historique des connexions</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center", backgroundColor: "#f5f5f5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#dc2626" },
  avatarWrapper: { marginTop: 8, marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#ddd" },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 28, fontWeight: "700", color: "#666" },
  avatarBadge: {
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  avatarBadgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  name: { fontSize: 19, fontWeight: "700", marginTop: 8 },
  email: { fontSize: 13, color: "#666", marginTop: 2 },
  badge: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  badgeActive: { backgroundColor: "#dcfce7", color: "#166534" },
  badgeInactive: { backgroundColor: "#fee2e2", color: "#991b1b" },
  infoBlock: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: { fontSize: 13, color: "#888" },
  infoValue: { fontSize: 13, fontWeight: "600" },
  actions: { width: "100%", marginTop: 20, gap: 10 },
  editButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
  },
  editButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  toggleButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
  },
  toggleButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  historyButton: {
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
  },
  historyButtonText: { color: "#2563eb", fontWeight: "600", fontSize: 14 },
});