// mobile/src/app/(dashboard)/finance/_layout.tsx

import { Stack } from 'expo-router';

export default function FinanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="budget/create" />
      <Stack.Screen name="expenses/index" />
      <Stack.Screen name="expenses/create" />
      <Stack.Screen name="revenues/index" />
      <Stack.Screen name="revenues/create" />
      <Stack.Screen name="cashflow/index" />
      <Stack.Screen name="profitability/index" />
    </Stack>
  );
}