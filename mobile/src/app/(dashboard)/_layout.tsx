import { useMemo } from "react";
import { Tabs, router, usePathname, Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePermissions } from "@/contexts/PermissionsContext";
import { getTabModules } from "@/constants/modules";

function DashboardTopBar() {
  const pathname = usePathname();
  const { permissions, isAdmin, userRole } = usePermissions();

  const { tabModules } = useMemo(
    () => getTabModules(permissions, isAdmin),
    [isAdmin, permissions]
  );

  const navItems = [
    {
      key: "home",
      title: "Accueil",
      icon: "home-outline",
      href: "/(dashboard)",
      active: pathname === "/(dashboard)" || pathname === "/(dashboard)/" || pathname === "/",
    },
    ...tabModules.map((module) => ({
      key: module.key,
      title: module.tabLabel ?? module.title,
      icon: module.ionicon,
      href: module.route,
      active: pathname.includes(module.route),
    })),
    {
      key: "more",
      title: "Plus",
      icon: "grid-outline",
      href: "/(dashboard)/more",
      active: pathname.includes("/more"),
    },
  ];

  return (
    <View style={styles.topBarShell}>
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.brandTitle}>Smart Sheep Manager</Text>
          <Text style={styles.brandSubtitle}>
            {isAdmin ? "Accès complet administrateur" : userRole || "Accès personnalisé selon vos droits"}
          </Text>
        </View>

        <View style={styles.rolePill}>
          <Ionicons name={isAdmin ? "shield-checkmark-outline" : "person-outline"} size={14} color="#EAFBF0" />
          <Text style={styles.rolePillText}>{isAdmin ? "ADMIN" : userRole || "USER"}</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {navItems.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => router.replace(item.href as Href)}
            style={({ pressed }) => [
              styles.tabChip,
              item.active && styles.tabChipActive,
              pressed && styles.tabChipPressed,
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={18}
              color={item.active ? "#166534" : "#5C8A72"}
            />
            <Text style={[styles.tabChipText, item.active && styles.tabChipTextActive]}>
              {item.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function DashboardLayout() {
  return (
    <View style={styles.container}>
      <DashboardTopBar />
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="herd" />
          <Tabs.Screen name="health" />
          <Tabs.Screen name="more" />
          <Tabs.Screen name="ai" />
          <Tabs.Screen name="ai-assistant" />
          <Tabs.Screen name="bi" />
          <Tabs.Screen name="commercial" />
          <Tabs.Screen name="communication" />
          <Tabs.Screen name="exploitations" />
          <Tabs.Screen name="fattening" />
          <Tabs.Screen name="feeding" />
          <Tabs.Screen name="finance" />
          <Tabs.Screen name="iot" />
          <Tabs.Screen name="permissions" />
          <Tabs.Screen name="profile" />
          <Tabs.Screen name="reporting" />
          <Tabs.Screen name="reproduction" />
          <Tabs.Screen name="users" />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2FAF5",
  },
  content: {
    flex: 1,
  },
  topBarShell: {
    backgroundColor: "#0F2A1D",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    color: "#8EBC9B",
    fontSize: 12,
    marginTop: 4,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(21, 128, 61, 0.26)",
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  rolePillText: {
    color: "#DDEFE4",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
  tabChipPressed: {
    opacity: 0.8,
  },
  tabChipActive: {
    backgroundColor: "#DFF5E6",
  },
  tabChipText: {
    color: "#2F6B46",
    fontSize: 12,
    fontWeight: "700",
  },
  tabChipTextActive: {
    color: "#166534",
  },
});
