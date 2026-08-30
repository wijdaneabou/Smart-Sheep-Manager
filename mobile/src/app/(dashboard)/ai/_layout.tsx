// mobile/src/app/(dashboard)/ai/_layout.tsx
import { Stack } from 'expo-router';

export default function AiLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF', // White header
        },
        headerTintColor: '#1A1A2E', // Dark text
        headerTitleStyle: {
          fontWeight: '600',
          color: '#1A1A2E',
        },
        headerBackTitle: '',
        headerShadowVisible: false, // Removes bottom border
        headerBackButtonDisplayMode: 'minimal',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Health Prediction',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[animalId]/detail"
        options={{
          title: 'Animal Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[animalId]/history"
        options={{
          title: 'Prediction History',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="stats/index"
        options={{
          title: 'Statistics',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Add Prediction',
          headerShown: true,
        }}
      />
    </Stack>
  );
}