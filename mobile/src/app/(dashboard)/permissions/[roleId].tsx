import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { permissionsApi, type Permission, type Role } from "../../../services/permissions.api";

const MODULES = [
  "USERS",
  "EXPLOITATIONS",
  "HERD",
  "IOT",
  "HEALTH",
  "REPRODUCTION",
  "FEEDING",
  "FATTENING",
  "AI",
  "FINANCE",
  "COMMERCIAL",
  "BI_DASHBOARD",
  "COMMUNICATION",
  "REPORTING",
  "ADMIN",
  "AI_ASSISTANT",
] as const;

const ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE"] as const;

type PermissionItem = Permission & { action: (typeof ACTIONS)[number]; module: string };

export default function PermissionMatrixScreen() {
  const { roleId } = useLocalSearchParams<{ roleId: string }>();
  const parsedRoleId = Number(roleId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);

  useEffect(() => {
    void fetchData();
  }, [parsedRoleId]);

  const fetchData = async () => {
    try {
      const [allResponse, roleResponse, rolesResponse] = await Promise.all([
        permissionsApi.getAll(),
        permissionsApi.getByRole(parsedRoleId),
        permissionsApi.getRoles(),
      ]);

      const parsedPermissions = (allResponse.data as Permission[]).map((permission) => {
        const [module, action] = permission.name.split(":");
        return {
          ...permission,
          module,
          action: action as PermissionItem["action"],
        };
      });

      setAllPermissions(parsedPermissions);

      const permissionNames = roleResponse.data.permissions || [];
      const permIds = parsedPermissions
        .filter((permission) => permissionNames.includes(permission.name))
        .map((permission) => permission.id);

      setSelectedPermissions(new Set(permIds));

      const role = (rolesResponse.data as Role[]).find((item) => item.id === parsedRoleId);
      setRoleName(role?.name ?? "");
    } catch (error) {
      console.error("Error loading permissions:", error);
      Alert.alert("Erreur", "Impossible de charger les permissions.");
    } finally {
      setLoading(false);
    }
  };

  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, PermissionItem[]> = {};
    MODULES.forEach((module) => {
      grouped[module] = [];
    });

    allPermissions.forEach((permission) => {
      if (grouped[permission.module]) {
        grouped[permission.module].push(permission);
      }
    });

    return grouped;
  }, [allPermissions]);

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((current) => {
      const next = new Set(current);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const toggleAllForModule = (modulePermissions: PermissionItem[]) => {
    const ids = modulePermissions.map((permission) => permission.id);
    const isFullySelected = ids.length > 0 && ids.every((id) => selectedPermissions.has(id));

    setSelectedPermissions((current) => {
      const next = new Set(current);
      if (isFullySelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      await permissionsApi.update(parsedRoleId, Array.from(selectedPermissions));
      Alert.alert("Succès", "Permissions mises à jour.");
      router.back();
    } catch (error) {
      console.error("Error saving permissions:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#15803D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{roleName || `Rôle ${roleId}`}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.instructions}>
          Cochez les permissions pour ce rôle. Le bouton “Tout” active ou retire toutes les actions d’un module.
        </Text>

        {MODULES.map((module) => {
          const perms = groupedPermissions[module] || [];
          if (perms.length === 0) return null;

          const ids = perms.map((permission) => permission.id);
          const selectedCount = ids.filter((id) => selectedPermissions.has(id)).length;
          const isFullySelected = ids.length > 0 && selectedCount === ids.length;
          const isPartiallySelected = selectedCount > 0 && !isFullySelected;

          return (
            <View
              key={module}
              style={[
                styles.moduleSection,
                isFullySelected && styles.moduleSectionSelected,
                isPartiallySelected && styles.moduleSectionPartial,
              ]}
            >
              <View style={styles.moduleHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>{module}</Text>
                  <Text style={styles.moduleSubtitle}>
                    {selectedCount}/{ids.length} permissions actives
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectAllButton,
                    isFullySelected && styles.selectAllButtonActive,
                    isPartiallySelected && styles.selectAllButtonPartial,
                  ]}
                  onPress={() => toggleAllForModule(perms)}
                >
                  <Text
                    style={[
                      styles.selectAllButtonText,
                      isFullySelected && styles.selectAllButtonTextActive,
                    ]}
                  >
                    {isFullySelected ? "Tout ✓" : isPartiallySelected ? "Tout" : "Tout"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionsGrid}>
                {ACTIONS.map((action) => {
                  const perm = perms.find((permission) => permission.action === action);
                  if (!perm) return null;

                  const isChecked = selectedPermissions.has(perm.id);

                  return (
                    <TouchableOpacity
                      key={perm.id}
                      style={[
                        styles.permissionCell,
                        isChecked && styles.permissionCellActive,
                      ]}
                      onPress={() => togglePermission(perm.id)}
                    >
                      <Text
                        style={[
                          styles.permissionCellText,
                          isChecked && styles.permissionCellTextActive,
                        ]}
                      >
                        {action}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={savePermissions}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2FAF5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#DDEFE4",
  },
  backButton: { fontSize: 16, color: "#15803D", fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F2A1D" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  instructions: {
    fontSize: 14,
    color: "#3E7A5B",
    marginBottom: 16,
    lineHeight: 20,
  },
  moduleSection: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DDEFE4",
    elevation: 1,
  },
  moduleSectionSelected: {
    borderColor: "#16a34a",
    backgroundColor: "#f0fdf4",
  },
  moduleSectionPartial: {
    borderColor: "#86efac",
  },
  moduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F2A1D",
  },
  moduleSubtitle: {
    fontSize: 12,
    color: "#5C8A72",
    marginTop: 2,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CFE8D8",
    backgroundColor: "#fff",
  },
  selectAllButtonPartial: {
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb",
  },
  selectAllButtonActive: {
    borderColor: "#15803D",
    backgroundColor: "#15803D",
  },
  selectAllButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2F6B46",
  },
  selectAllButtonTextActive: {
    color: "white",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  permissionCell: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "white",
  },
  permissionCellActive: {
    backgroundColor: "#15803D",
    borderColor: "#15803D",
  },
  permissionCellText: { fontSize: 12, color: "#2F6B46", fontWeight: "700" },
  permissionCellTextActive: { color: "white" },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#DDEFE4",
  },
  saveButton: {
    backgroundColor: "#15803D",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
