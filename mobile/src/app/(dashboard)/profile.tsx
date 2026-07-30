import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePermissions } from "@/contexts/PermissionsContext";
import { getFileUrl } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, userRole } = usePermissions();
  const photoUrl = getFileUrl(user?.photo);

  // Format date if available
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon profil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: "#E6F8ED" }]}>
                <Ionicons name="person-outline" size={50} color="#15803D" />
              </View>
            )}
          </View>

          <Text style={styles.name}>
            {user?.firstName || "Utilisateur"} {user?.lastName || ""}
          </Text>
          <Text style={styles.email}>{user?.email || "email@exemple.com"}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userRole || "Rôle"}</Text>
          </View>
        </View>

        {/* Information List */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#0F2A1D" />
            <Text style={styles.infoLabel}>Prénom</Text>
            <Text style={styles.infoValue}>{user?.firstName || "—"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#0F2A1D" />
            <Text style={styles.infoLabel}>Nom</Text>
            <Text style={styles.infoValue}>{user?.lastName || "—"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#0F2A1D" />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || "—"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#0F2A1D" />
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{user?.phone || "Non renseigné"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#0F2A1D" />
            <Text style={styles.infoLabel}>Rôle</Text>
            <Text style={styles.infoValue}>{userRole || "—"}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="calendar-outline" size={20} color="#0F2A1D" />
            <Text style={styles.infoLabel}>Membre depuis</Text>
            <Text style={styles.infoValue}>{joinedDate}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2FAF5",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F2A1D",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#15803D",
    backgroundColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F2A1D",
  },
  email: {
    fontSize: 14,
    color: "#5C8A72",
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: "#E6F8ED",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#15803D",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#5C8A72",
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F2A1D",
  },
});