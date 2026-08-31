import { useFonts } from 'expo-font';
import { Stack , SplashScreen } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useEffect } from "react";
import { QueryClient } from '@tanstack/query-core';
import { QueryClientProvider } from '@tanstack/react-query';
import { PermissionsProvider } from "@/contexts/PermissionsContext";

// Create a QueryClient instance
const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PermissionsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(dashboard)" />
            {/* autres écrans si besoin */}
          </Stack>
        </PermissionsProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
