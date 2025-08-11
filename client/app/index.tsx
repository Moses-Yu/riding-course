import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

type RouteItem = {
  id: number;
  title: string;
  summary?: string;
  region1?: string;
  like_count: number;
  comment_count: number;
};

export default function Home() {
  const [items, setItems] = useState<RouteItem[]>([]);
  const [region1, setRegion1] = useState('');
  const [sort, setSort] = useState<'popular' | 'comments' | 'latest' | 'opens'>('popular');

  const load = async () => {
    const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
    const q = new URLSearchParams();
    if (region1.trim()) q.set('region1', region1.trim());
    if (sort) q.set('sort', sort);
    const res = await fetch(`${api}/routes?${q.toString()}`);
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => { load(); }, [region1, sort]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Riding Course</Text>
      <View style={styles.row}>
        <TextInput placeholder="Region" value={region1} onChangeText={setRegion1} style={[styles.input, { flex: 1 }]} />
        <TouchableOpacity onPress={() => setRegion1('')} style={styles.clearBtn}><Text>Clear</Text></TouchableOpacity>
      </View>
      <View style={styles.rowWrap}>
        {(['popular','comments','latest','opens'] as const).map(s => (
          <TouchableOpacity key={s} onPress={()=>setSort(s)} style={[styles.chip, sort===s && styles.chipActive]}>
            <Text style={sort===s ? styles.chipActiveText : styles.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {items.map(it => (
          <Link key={it.id} href={{ pathname: '/route-detail', params: { id: String(it.id) } }} asChild>
            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardTitle}>{it.title}</Text>
              {it.summary && <Text style={styles.cardSummary}>{it.summary}</Text>}
              <Text style={styles.cardMeta}>{it.region1 ?? ''}  ·  ❤ {it.like_count}  💬 {it.comment_count}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Link href="/route-create"><Text style={styles.link}>Create Route</Text></Link>
        <Link href="/my"><Text style={styles.link}>My</Text></Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#000' },
  chipActive: { backgroundColor: '#000' },
  chipText: { color: '#000' },
  chipActiveText: { color: '#fff' },
  card: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8, borderColor: '#ddd' },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSummary: { color: '#555', marginTop: 4 },
  cardMeta: { color: '#777', marginTop: 6, fontSize: 12 },
  footer: { flexDirection: 'row', gap: 16, paddingTop: 8 },
  link: { color: '#2563eb' }
});

