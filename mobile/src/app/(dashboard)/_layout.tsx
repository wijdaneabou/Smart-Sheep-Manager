import { useMemo, useState } from "react";
import { Tabs, router, usePathname, Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePermissions } from "@/contexts/PermissionsContext";
import { getTabModules } from "@/constants/modules";
import ProfileModal from "@/components/ProfileModal";
import { getFileUrl } from "@/services/api";

// ----- Header (top) with brand title and avatar -----
function DashboardHeader() {
  const [modalVisible, setModalVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user } = usePermissions();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const getInitials = () => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  const photoUrl = getFileUrl(user?.photo);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>Smart Sheep Manager</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.headerSeparator} />
      <ProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    </View>
  );
}

// ----- Bottom navigation bar (wrapped with SafeAreaView) -----
function DashboardBottomBar() {
  const pathname = usePathname();
  const { permissions, isAdmin } = usePermissions();

  const { tabModules, moreModules } = useMemo(
    () => getTabModules(permissions, isAdmin),
    [isAdmin, permissions]
  );

  const navItems = useMemo(() => {
    const items = [
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
    ];

    if (moreModules.length > 0) {
      items.push({
        key: "more",
        icon: "grid-outline",
        href: "/(dashboard)/more",
        active: pathname.includes("/more"),
      });
    }

    return items;
  }, [pathname, tabModules, moreModules]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
      <View style={styles.bottomBar}>
        <View style={styles.navRow}>
          {navItems.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => router.navigate(item.href as Href)}
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
    </SafeAreaView>
  );
}

export default function DashboardLayout() {
  return (
    <View style={styles.container}>
      <DashboardHeader />
      <View style={styles.content}>
        <Tabs
          backBehavior="history"
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
      <DashboardBottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 4,
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "400", // Billabong is a script font, use regular weight
    color: "#0F2A1D",
    letterSpacing: 0,
    fontFamily: "Billabong", // matches the key in useFonts
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#15803D",
    backgroundColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#15803D",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeBottom: {
    backgroundColor: "#FFFFFF",
  },
  bottomBar: {
    backgroundColor: "#FFFFFF",
    paddingTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
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