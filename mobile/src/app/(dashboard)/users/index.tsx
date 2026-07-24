import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router, useFocusEffect, usePathname } from "expo-router";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  listUsers,
  deactivateUser,
  reactivateUser,
  type User,
} from "../../../services/userService";
import { getRoleName } from "../../../constants/roles";
import { logout } from "../../../services/authService";

type NavItem = {
  key: string;
  icon: string;
  label: string;
  route?: string;
  isLogout?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", icon: "🏠", label: "Dashboard", route: "/" },
  { key: "exploitations", icon: "🏞️", label: "Exploitations", route: "/exploitations" },
  { key: "users", icon: "👥", label: "Users", route: "/users" },
  { key: "sessions", icon: "🔐", label: "Sessions", route: "/audit/sessions" },
  { key: "audit", icon: "🧾", label: "Audit", route: "/audit" },
  { key: "profile", icon: "👤", label: "Profile", isLogout: true },
];

export default function UsersListScreen() {
  const { hasPermission } = usePermissions();
  const pathname = usePathname();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function fetchUsers() {
    setError(null);
    const result = await listUsers({ search: search || undefined, limit: 50 });
    if (result.success) {
      setUsers(result.data);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUsers().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }

  async function handleToggleStatus(user: User) {
    setActionLoadingId(user.id);
    const result =
      user.status === "ACTIVE"
        ? await deactivateUser(user.id)
        : await reactivateUser(user.id);

    if (result.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? result.user : u))
      );
    } else {
      setError(result.message);
    }
    setActionLoadingId(null);
  }

  function handleLogoutPress() {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            await logout();
            setLoggingOut(false);
          },
        },
      ]
    );
  }

  function handleNavPress(item: NavItem) {
    if (item.isLogout) {
      handleLogoutPress();
    } else if (item.route) {
      router.push(item.route as any);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Utilisateurs</Text>
            <Text style={styles.subtitle}>
              {users.length} compte{users.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher (nom, email)..."
          placeholderTextColor="#A6C8B2"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => {
            setLoading(true);
            fetchUsers().finally(() => setLoading(false));
          }}
        />

        {hasPermission("USERS", "CREATE") && (
          <Link href="/users/create" asChild>
            <Pressable style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Ajouter un utilisateur</Text>
            </Pressable>
          </Link>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun utilisateur trouve.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Link
                  href={{
                    pathname: "/users/[id]",
                    params: { id: String(item.id) },
                  }}
                  asChild
                >
                  <Pressable style={styles.cardInfo}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>
                        {item.firstName[0]}
                        {item.lastName[0]}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>
                        {item.firstName} {item.lastName}
                      </Text>
                      <Text style={styles.email} numberOfLines={1}>
                        {item.email}
                      </Text>

                      <View style={styles.metaRow}>
                        <Text style={styles.roleBadge}>
                          {getRoleName(item.roleId)}
                        </Text>
                        <Text
                          style={[
                            styles.badge,
                            item.status === "ACTIVE"
                              ? styles.badgeActive
                              : styles.badgeInactive,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Link>

                <Pressable
                  style={styles.toggleButton}
                  onPress={() => handleToggleStatus(item)}
                  disabled={actionLoadingId === item.id}
                >
                  {actionLoadingId === item.id ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <Text style={styles.toggleButtonText}>
                      {item.status === "ACTIVE" ? "Desactiver" : "Reactiver"}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          />
        )}
      </View>

      {/* Barre de navigation en bas */}
      <View style={styles.bottomNav}>
        {NAV_ITEMS.map((item) => {
          const isActive = !item.isLogout && pathname === item.route;
          return (
            <Pressable
              key={item.key}
              style={styles.navItem}
              onPress={() => handleNavPress(item)}
              disabled={item.isLogout && loggingOut}
            >
              {item.isLogout && loggingOut ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                  {item.icon}
                </Text>
              )}
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2FAF5" },
  container: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  subtitle: { fontSize: 13, color: "#7EAB91", marginTop: 2, marginBottom: 14 },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  error: { color: "#166534", marginBottom: 8, fontSize: 13 },
  empty: { textAlign: "center", color: "#7EAB91", marginTop: 24 },
  listContent: { paddingBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardInfo: { flex: 1, flexDirection: "row", alignItems: "center" },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarInitials: { fontSize: 15, fontWeight: "700", color: "#4f46e5" },
  name: { fontSize: 15, fontWeight: "600" },
  email: { fontSize: 13, color: "#5C8A72", marginTop: 1 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4f46e5",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  badgeActive: { backgroundColor: "#dcfce7", color: "#166534" },
  badgeInactive: { backgroundColor: "#fee2e2", color: "#991b1b" },
  toggleButton: {
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
  },
  toggleButtonText: { color: "#2563eb", fontSize: 12, fontWeight: "600" },

  addButton: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  navIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#15803D",
    fontWeight: "700",
  },
});