import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { permissionsApi } from "../../../services/permissions.api";

// Define modules and actions (match backend)
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
];

const ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE"];

export default function PermissionMatrixScreen() {
  const { roleId } = useLocalSearchParams<{ roleId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(
    new Set()
  );
  const [allPermissions, setAllPermissions] = useState<any[]>([]);

  // Load permissions for this role
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get all permissions
      const allResponse = await permissionsApi.getAll();
      setAllPermissions(allResponse.data);
  
      // Get permissions for this role
      const roleResponse = await permissionsApi.getByRole(Number(roleId));
      // Backend returns { roleId, permissions: string[] }
      const permissionNames = roleResponse.data.permissions || [];
      
      // Convert permission names to IDs
      const permIds = allResponse.data
        .filter((p: any) => permissionNames.includes(p.name))
        .map((p: any) => p.id);
      
      setSelectedPermissions(new Set(permIds));
  
      // Get role name
      const rolesResponse = await permissionsApi.getRoles();
      const role = rolesResponse.data.find((r: any) => r.id === Number(roleId));
      if (role) setRoleName(role.name);
    } catch (error) {
      console.error("Error loading permissions:", error);
      Alert.alert("Erreur", "Impossible de charger les permissions.");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: number) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissions(newSet);
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      await permissionsApi.update(
        Number(roleId),
        Array.from(selectedPermissions)
      );
      Alert.alert("Succès", "Permissions mises à jour.");
      router.back();
    } catch (error) {
      console.error("Error saving permissions:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les permissions.");
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by module
  const getPermissionsByModule = () => {
    const grouped: Record<string, any[]> = {};
    MODULES.forEach((m) => (grouped[m] = []));
    allPermissions.forEach((p) => {
      const [module, action] = p.name.split(":");
      if (grouped[module]) {
        grouped[module].push({ ...p, action });
      }
    });
    return grouped;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const groupedPermissions = getPermissionsByModule();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {roleName || `Rôle ${roleId}`}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.instructions}>
          Cochez les permissions pour ce rôle.
        </Text>

        {MODULES.map((module) => {
          const perms = groupedPermissions[module] || [];
          if (perms.length === 0) return null;

          return (
            <View key={module} style={styles.moduleSection}>
              <Text style={styles.moduleTitle}>{module}</Text>
              <View style={styles.actionsGrid}>
                {ACTIONS.map((action) => {
                  const perm = perms.find((p) => p.action === action);
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
            {saving ? "Sauvegarde..." : "💾 Sauvegarder"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: { fontSize: 16, color: "#2563eb" },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 16 },
  scrollView: { flex: 1, padding: 16 },
  instructions: { fontSize: 14, color: "#666", marginBottom: 16 },
  moduleSection: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  permissionCell: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
    marginRight: 8,
    marginBottom: 8,
  },
  permissionCellActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  permissionCellText: { fontSize: 12, color: "#333" },
  permissionCellTextActive: { color: "white" },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
});