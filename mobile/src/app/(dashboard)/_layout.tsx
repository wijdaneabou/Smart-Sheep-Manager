import { Redirect, Stack, usePathname } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { PermissionsProvider, usePermissions } from "@/contexts/PermissionsContext";

function DashboardShell() {
  const pathname = usePathname();
  const { loading, isAdmin } = usePermissions();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#15803D" />
      </View>
    );
  }

  if (pathname.startsWith("/permissions") && !isAdmin) {
    return <Redirect href="/(dashboard)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function DashboardLayout() {
  return (
    <PermissionsProvider>
      <DashboardShell />
    </PermissionsProvider>
  );
}
