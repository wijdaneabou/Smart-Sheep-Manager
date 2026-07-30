import { useMemo } from "react";
import { Tabs, router, usePathname, Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePermissions } from "@/contexts/PermissionsContext";
import { getTabModules } from "@/constants/modules";

function DashboardTopBar() {
  const pathname = usePathname();
  const { permissions, isAdmin } = usePermissions();

  const { tabModules } = useMemo(
    () => getTabModules(permissions, isAdmin),
    [isAdmin, permissions]
  );

  const navItems = [
    {
      key: "home",
      icon: "home-outline",
      href: "/(dashboard)",
      active: pathname === "/(dashboard)" || pathname === "/(dashboard)/" || pathname === "/",
    },
    ...tabModules.map((module) => ({
      key: module.key,
      icon: module.ionicon,
      href: module.route,
      active: pathname.includes(module.route),
    })),
    {
      key: "more",
      icon: "grid-outline",
      href: "/(dashboard)/more",
      active: pathname.includes("/more"),
    },
  ];

  return (
    <View style={styles.topBar}>
      <Text style={styles.brandTitle}>Smart Sheep Manager</Text>

      <View style={styles.navRow}>
        {navItems.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => router.replace(item.href as Href)}
            style={({ pressed }) => [
              styles.navItem,
              pressed && styles.navItemPressed,
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={28}
              color={item.active ? "#0F2A1D" : "#5C8A72"}
            />
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
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF", // blanc pour tout l'écran
  },
  topBar: {
    backgroundColor: "#FFFFFF",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 0, // pas de ligne de séparation
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F2A1D", // vert foncé
    letterSpacing: -0.5,
    marginBottom: 10,
    fontFamily: "DancingScript_700Bold",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 4,
  },
  navItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  navItemPressed: {
    opacity: 0.6,
  },
});