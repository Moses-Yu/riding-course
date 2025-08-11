import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text, View } from 'react-native';

export default function RootLayout() {
  const router = useRouter();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Riding Course',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 6, paddingRight: 8 }}>
              <TouchableOpacity
                onPress={() => router.push('/route-create')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ paddingHorizontal: 6, paddingVertical: 4 }}
              >
                <Text style={{ color: '#2563eb', fontWeight: '600' }}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/my')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ paddingHorizontal: 6, paddingVertical: 4 }}
              >
                <Text style={{ color: '#2563eb', fontWeight: '600' }}>My</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Stack.Screen name="route-create" options={{ title: 'Create Route' }} />
      <Stack.Screen name="route-detail" options={{ title: 'Route Detail' }} />
      <Stack.Screen name="route-edit" options={{ title: 'Edit Route' }} />
      <Stack.Screen name="my" options={{ title: 'My' }} />
      <Stack.Screen name="register" options={{ title: 'Register' }} />
    </Stack>
  );
}

