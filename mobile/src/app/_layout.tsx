import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { Stack } from "expo-router";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { PermissionsProvider } from "@/contexts/PermissionsContext"; // ✅ import du Provider

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular,
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded) return null;

  return (
    <PermissionsProvider> {/* ✅ wrap tout l'application */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(dashboard)" />
        {/* autres écrans si besoin */}
      </Stack>
    </PermissionsProvider>
  );
}