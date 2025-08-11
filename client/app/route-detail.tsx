import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Linking, StyleSheet } from 'react-native';

export default function RouteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [route, setRoute] = useState<any | null>(null);

  useEffect(() => {
    const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
    fetch(`${api}/routes/${id}`).then(r=>r.json()).then(setRoute);
  }, [id]);

  const openNaver = async () => {
    if (!route) return;
    const url = route.nmap_url || route.open_url;
    if (Platform.OS === 'web') {
      // On Android web, prefer intent://; for simplicity, use open_url directly
      window.location.href = url;
    } else {
      await Linking.openURL(url);
    }
    const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
    fetch(`${api}/routes/${route.id}/open-track`, { method: 'POST' });
  };

  if (!route) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{route.title}</Text>
      {route.summary && <Text>{route.summary}</Text>}
      <View style={{ marginTop: 'auto' }}>
        <TouchableOpacity onPress={openNaver} style={{ backgroundColor: '#16a34a', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>네이버로 열기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

