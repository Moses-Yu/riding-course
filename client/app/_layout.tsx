import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Riding Course' }} />
      <Stack.Screen name="route-create" options={{ title: 'Create Route' }} />
      <Stack.Screen name="route-detail" options={{ title: 'Route Detail' }} />
      <Stack.Screen name="my" options={{ title: 'My' }} />
    </Stack>
  );
}

