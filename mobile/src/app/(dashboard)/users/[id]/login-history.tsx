import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  getLoginHistory,
  type LoginHistoryEntry,
} from "../../../../services/userService";

export default function LoginHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  const [entries, setEntries] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getLoginHistory(userId).then((result) => {
        if (!active) return;
        if (result.success) {
          setEntries(result.data);
        } else {
          setError(result.message);
        }
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [userId])
  );

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historique des connexions</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune connexion enregistree.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View
              style={[
                styles.dot,
                { backgroundColor: item.success ? "#16a34a" : "#166534" },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>
                {new Date(item.loginAt).toLocaleString("fr-FR")}
              </Text>
              <Text style={styles.meta}>
                {item.success ? "Connexion reussie" : "Tentative echouee"}
                {item.ip ? ` · ${item.ip}` : ""}
              </Text>
              {item.userAgent && (
                <Text style={styles.userAgent} numberOfLines={1}>
                  {item.userAgent}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2FAF5", padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  error: { color: "#166534", marginBottom: 8, fontSize: 13 },
  empty: { textAlign: "center", color: "#7EAB91", marginTop: 24 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 10 },
  date: { fontSize: 13, fontWeight: "600" },
  meta: { fontSize: 12, color: "#5C8A72", marginTop: 2 },
  userAgent: { fontSize: 11, color: "#A6C8B2", marginTop: 2 },
});