import { useState, useEffect } from "react";
import { View, FlatList, TouchableOpacity, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { permissionsApi } from "../../../services/permissions.api";

interface Role {
  id: number;
  name: string;
  description: string;
}

export default function PermissionsListScreen() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await permissionsApi.getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={roles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/permissions/${item.id}`)}
          >
            <Text style={styles.roleName}>{item.name}</Text>
            <Text style={styles.roleDesc}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F2FAF5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  roleName: { fontSize: 18, fontWeight: "bold" },
  roleDesc: { fontSize: 14, color: "#5C8A72", marginTop: 4 },
});