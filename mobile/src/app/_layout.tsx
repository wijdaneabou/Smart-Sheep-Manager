import { useFonts } from 'expo-font';
import { Stack , SplashScreen } from "expo-router";

import { useEffect } from "react";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    // Load Billabong from assets/fonts
    'Billabong': require('../../assets/fonts/Billabong.otf'),
    // (keep other fonts if you have them)
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded) return null;

  return (
    <PermissionsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(dashboard)" />
        {/* autres écrans si besoin */}
      </Stack>
    </PermissionsProvider>
  );
}