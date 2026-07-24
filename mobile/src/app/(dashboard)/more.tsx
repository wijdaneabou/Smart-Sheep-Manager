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
import { getPermittedModules } from "@/constants/modules";

export default function MoreScreen() {
  const { permissions, isAdmin } = usePermissions();

  const accessibleModules = useMemo(
    () => getPermittedModules(permissions, isAdmin),
    [isAdmin, permissions]
  );

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Tous les modules</Text>
        <Text style={styles.subtitle}>
          {accessibleModules.length} module{accessibleModules.length > 1 ? "s" : ""} visible{accessibleModules.length > 1 ? "s" : ""} selon les droits du rôle.
        </Text>
      </View>

      <View style={styles.grid}>
        {accessibleModules.map((mod) => (
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
    backgroundColor: "#F3F7F4",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    marginTop: 6,
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
    shadowColor: "#0F172A",
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
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748B",
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
    color: "#94A3B8",
    fontWeight: "700",
  },
});
