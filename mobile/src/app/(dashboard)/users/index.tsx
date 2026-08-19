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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  listUsers,
  deactivateUser,
  reactivateUser,
  type User,
  type UserStatus,
} from "../../../services/userService";
import { getRoleName } from "../../../constants/roles";
import SubTabBar from "@/components/SubTabBar";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";

const STATUS_OPTIONS: { label: string; value: UserStatus | "" }[] = [
  { label: "Tous les statuts", value: "" },
  { label: "Actif", value: "ACTIVE" },
  { label: "Inactif", value: "INACTIVE" },
  { label: "Suspendu", value: "SUSPENDED" },
];

export default function UsersListScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  async function fetchUsers() {
    setError(null);
    const result = await listUsers({
      search: search || undefined,
      status: statusFilter || undefined,
      limit: 50,
    });
    if (result.success) {
      setUsers(result.data);
    } else {
      setError(result.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      fetchUsers().finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const inactiveCount = users.length - activeCount;
  const selectedStatusLabel =
    STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || "Tous les statuts";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={GREEN} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Utilisateurs</Text>
          <Text style={styles.headerSubtitle}>
            {users.length} compte{users.length > 1 ? "s" : ""}
            {" · "}
            {activeCount} actif{activeCount > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher (nom, email)..."
            placeholderTextColor="#B0B0B0"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              setLoading(true);
              fetchUsers().finally(() => setLoading(false));
            }}
          />
        </View>

        <Pressable
          style={styles.filterButton}
          onPress={() => setShowStatusModal(true)}
        >
          <Ionicons name="filter-outline" size={15} color={GREEN} />
          <Text style={styles.filterButtonText}>{selectedStatusLabel}</Text>
          <Ionicons name="chevron-down" size={15} color={GREEN} />
        </Pressable>

        <SubTabBar />

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={GREEN} />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={32} color="#B0B0B0" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isActive = item.status === "ACTIVE";
              return (
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
                        <Text style={styles.name} numberOfLines={1}>
                          {item.firstName} {item.lastName}
                        </Text>
                        <Text style={styles.email} numberOfLines={1}>
                          {item.email}
                        </Text>

                        <View style={styles.metaRow}>
                          <View style={styles.roleBadge}>
                            <Ionicons name="ribbon-outline" size={11} color={GREEN} />
                            <Text style={styles.roleBadgeText}>{getRoleName(item.roleId)}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: isActive ? "#15803D" : "#DC2626" },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusBadgeText,
                                { color: isActive ? "#15803D" : "#DC2626" },
                              ]}
                            >
                              {isActive ? "Actif" : item.status === "SUSPENDED" ? "Suspendu" : "Inactif"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Ionicons name="chevron-forward" size={18} color="#D0D0D0" />
                    </Pressable>
                  </Link>

                  <Pressable
                    style={styles.toggleButton}
                    onPress={() => handleToggleStatus(item)}
                    disabled={actionLoadingId === item.id}
                  >
                    {actionLoadingId === item.id ? (
                      <ActivityIndicator size="small" color={GREEN} />
                    ) : (
                      <Ionicons
                        name={isActive ? "pause-circle-outline" : "play-circle-outline"}
                        size={16}
                        color={isActive ? "#DC2626" : GREEN}
                      />
                    )}
                    <Text
                      style={[
                        styles.toggleButtonText,
                        { color: isActive ? "#DC2626" : GREEN },
                      ]}
                    >
                      {isActive ? "Désactiver" : "Réactiver"}
                    </Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}
      </View>

      {hasPermission("USERS", "CREATE") && (
        <Link href="/users/create" asChild>
          <Pressable style={styles.fab}>
            <Feather name="plus" size={26} color="#fff" />
          </Pressable>
        </Link>
      )}

      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrer par statut</Text>
            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.modalOption,
                  statusFilter === option.value && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setStatusFilter(option.value);
                  setShowStatusModal(false);
                  setLoading(true);
                  fetchUsers().finally(() => setLoading(false));
                }}
              >
                {statusFilter === option.value && (
                  <Ionicons name="checkmark" size={16} color={GREEN} style={{ marginRight: 6 }} />
                )}
                <Text
                  style={[
                    styles.modalOptionText,
                    statusFilter === option.value && styles.modalOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CREAM },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: GREEN, textAlign: "center" },
  headerSubtitle: { fontSize: 12, color: "#888", textAlign: "center", marginTop: 1 },

  container: { flex: 1, paddingHorizontal: 16 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: "#1f2937" },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 12,
  },
  filterButtonText: { fontSize: 13, color: GREEN, fontWeight: "700" },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: { color: "#dc2626", fontSize: 13, flex: 1 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  listContent: { paddingBottom: 100 },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    marginTop: 8,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#666" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardInfo: { flexDirection: "row", alignItems: "center" },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarInitials: { fontSize: 15, fontWeight: "800", color: GREEN },
  name: { fontSize: 15, fontWeight: "700", color: "#111" },
  email: { fontSize: 12, color: "#888", marginTop: 1 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: { fontSize: 10, fontWeight: "700", color: GREEN },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeActive: { backgroundColor: "#F0FDF4" },
  statusBadgeInactive: { backgroundColor: "#FEF2F2" },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },

  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  toggleButtonText: { fontSize: 12, fontWeight: "700" },

  // Floating action button — style repris du screenshot
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    width: "80%",
    maxWidth: 320,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, color: GREEN },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionSelected: { backgroundColor: "#F0FDF4" },
  modalOptionText: { fontSize: 14, color: "#444" },
  modalOptionTextSelected: { fontWeight: "700", color: GREEN },
});