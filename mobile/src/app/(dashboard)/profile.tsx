import { useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/contexts/PermissionsContext";

export default function ProfileScreen() {
  const { user, getFullName, getInitials } = useAuth();
  const { userRole, isAdmin, permissions } = usePermissions();

  const roleLabel = useMemo(() => userRole || "USER", [userRole]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#0F2A1D" />
        </Pressable>
        <Text style={styles.headerTitle}>Mon profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>

        <Text style={styles.name}>{getFullName() || "Utilisateur"}</Text>
        <Text style={styles.email}>{user?.email || "email@ssm.ma"}</Text>

        <View style={[styles.roleBadge, isAdmin && styles.roleBadgeAdmin]}>
          <Text style={[styles.roleBadgeText, isAdmin && styles.roleBadgeTextAdmin]}>
            {roleLabel}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="Prénom" value={user?.firstName || "—"} />
          <InfoRow label="Nom" value={user?.lastName || "—"} />
          <InfoRow label="Email" value={user?.email || "—"} />
          <InfoRow label="Téléphone" value={user?.phone || "—"} />
          <InfoRow label="Rôle" value={roleLabel} />
          <InfoRow label="Permissions" value={String(permissions.length)} />
        </View>
      </View>
    </SafeAreaView>
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
  safeArea: { flex: 1, backgroundColor: "#F2FAF5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F2A1D",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F2A1D" },
  container: { flex: 1, alignItems: "center", paddingTop: 12, paddingHorizontal: 16 },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#166534",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#0F2A1D",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 3,
  },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: "#0F2A1D" },
  email: { fontSize: 14, color: "#5C8A72", marginTop: 4 },
  roleBadge: {
    marginTop: 10,
    backgroundColor: "#DDEFE4",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  roleBadgeAdmin: {
    backgroundColor: "#DFF5E6",
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2F6B46",
    letterSpacing: 0.3,
  },
  roleBadgeTextAdmin: {
    color: "#166534",
  },
  infoCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: 24,
    shadowColor: "#0F2A1D",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5F4EA",
  },
  infoLabel: { fontSize: 14, color: "#5C8A72" },
  infoValue: { fontSize: 14, fontWeight: "700", color: "#0F2A1D", flexShrink: 1, textAlign: "right" },
});
