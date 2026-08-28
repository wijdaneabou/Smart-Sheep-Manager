import { useFonts } from 'expo-font';
import { Stack , SplashScreen } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useEffect } from "react";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    'Billabong': require('../../assets/fonts/Billabong.otf'),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PermissionsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(dashboard)" />
        </Stack>
      </PermissionsProvider>
    </GestureHandlerRootView>
  );
}
