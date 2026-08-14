import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, usePathname } from "expo-router";

const DEFAULT_TABS = [
  { key: "users", label: "Users", route: "/users" },
  { key: "sessions", label: "Sessions", route: "/audit/sessions" },
  { key: "audit", label: "Audit", route: "/audit" },
];

type Tab = { key: string; label: string; route?: string };

type Props = {
  tabs?: Tab[];
  activeKey?: string;
  onTabPress?: (key: string) => void;
};

export default function SubTabBar({ tabs = DEFAULT_TABS, activeKey, onTabPress }: Props) {
  const pathname = usePathname();
  const isDynamic = !!onTabPress;

  function handleTabPress(tab: Tab) {
    if (isDynamic && onTabPress) {
      onTabPress(tab.key);
    } else if (tab.route) {
      router.push(tab.route as any);
    }
  }

  const resolvedActiveKey = isDynamic ? activeKey : (activeKey || pathname);

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = resolvedActiveKey === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => handleTabPress(tab)}
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
    fontSize: 12,
    fontWeight: "600",
    color: "#7EAB91",
  },
  tabLabelActive: {
    color: "#0F2A1D",
    fontWeight: "700",
  },
});