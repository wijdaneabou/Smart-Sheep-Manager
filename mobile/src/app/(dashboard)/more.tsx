import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { usePermissions } from "@/contexts/PermissionsContext";
import { getTabModules } from "@/constants/modules";

export default function MoreScreen() {
  const { permissions, isAdmin } = usePermissions();

  const { moreModules } = useMemo(
    () => getTabModules(permissions, isAdmin),
    [isAdmin, permissions]
  );

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ✅ Hero card removed */}

      <View style={styles.grid}>
        {moreModules.map((mod) => (
          <Pressable
            key={mod.route}
            style={({ pressed }) => [
              styles.card,
              !mod.available && styles.cardDisabled,
              pressed && styles.cardPressed,
            ]}
            onPress={() => handlePress(mod.route)}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${mod.color}18` }]}>
              <Ionicons name={mod.ionicon as any} size={24} color={mod.color} />
            </View>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={styles.cardSubtitle}>{mod.subtitle}</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.badge, { color: mod.color }]}>{mod.adminOnly ? "Admin" : mod.available ? "Ouvert" : "À venir"}</Text>
              {!mod.available && <Text style={styles.lockText}>Bloqué</Text>}
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2FAF5",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#0F2A1D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardDisabled: {
    opacity: 0.65,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F2A1D",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#5C8A72",
    marginTop: 4,
    minHeight: 34,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: "800",
  },
  lockText: {
    fontSize: 11,
    color: "#8EBC9B",
    fontWeight: "700",
  },
});