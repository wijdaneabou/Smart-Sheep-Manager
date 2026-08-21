import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PermissionsProvider } from "@/contexts/PermissionsContext";

// Create a QueryClient instance
const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <PermissionsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(dashboard)" />
          {/* autres écrans si besoin */}
        </Stack>
      </PermissionsProvider>
    </QueryClientProvider>
  );
}