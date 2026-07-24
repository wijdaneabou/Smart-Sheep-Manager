import { Stack } from "expo-router";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

export default function RootLayout() {
  return (
    <PermissionsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(dashboard)" />
      </Stack>
    </PermissionsProvider>
  );
}