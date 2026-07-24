import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, usePathname } from "expo-router";

const TABS = [
  { key: "users", label: "Users", route: "/users" },
  { key: "sessions", label: "Sessions", route: "/audit/sessions" },
  { key: "audit", label: "Audit", route: "/audit" },
];

export default function SubTabBar() {
  const pathname = usePathname();

  function handleTabPress(route: string) {
    router.push(route as any);
  }

  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => handleTabPress(tab.route)}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 14,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: "#E6F7EC",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7EAB91",
  },
  tabLabelActive: {
    color: "#0F2A1D",
    fontWeight: "700",
  },
});