import { Text } from "react-native";
import { Stack } from "expo-router";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { Fonts } from "@/constants/theme";

Text.defaultProps = {
  ...(Text.defaultProps ?? {}),
  style: { fontFamily: Fonts.serif },
};

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
