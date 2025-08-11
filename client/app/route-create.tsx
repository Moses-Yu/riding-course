import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import PasteBox from '../components/PasteBox';

export default function RouteCreate() {
  const [parsed, setParsed] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const handleParsed = (raw: string, p?: any) => {
    setParsed(p ?? null);
    if (p?.dest?.name && p?.start?.name) {
      const suggestion = `${p.start.name} → ${p.dest.name}`;
      if (!title) setTitle(suggestion);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    const body: any = {
      title: title || 'Untitled',
      summary,
      open_url: parsed.openUrl,
      nmap_url: parsed.nmapUrl,
    };
    if (parsed.dest) {
      body.points = [];
      if (parsed.start) body.points.push({ lat: parsed.start.lat, lng: parsed.start.lng, name: parsed.start.name });
      for (const w of parsed.waypoints || []) body.points.push({ lat: w.lat, lng: w.lng, name: w.name });
      body.points.push({ lat: parsed.dest.lat, lng: parsed.dest.lng, name: parsed.dest.name });
    }
    const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
    const res = await fetch(`${api}/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    alert(res.ok ? 'Saved' : `Error: ${JSON.stringify(data)}`);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <PasteBox onParsed={handleParsed} />
      {parsed && (
        <View style={{ gap: 6 }}>
          <Text style={styles.previewTitle}>미리보기</Text>
          <Text>모드: {parsed.modality}</Text>
          {parsed.start && <Text>출발: {parsed.start.name ?? ''} ({parsed.start.lat}, {parsed.start.lng})</Text>}
          <Text>경유지: {(parsed.waypoints ?? []).length}개</Text>
          {parsed.dest && <Text>도착: {parsed.dest.name ?? ''} ({parsed.dest.lat}, {parsed.dest.lng})</Text>}
        </View>
      )}
      <View style={{ gap: 8 }}>
        <TextInput style={styles.input} placeholder="제목" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="요약" value={summary} onChangeText={setSummary} />
      </View>
      <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>저장</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  previewTitle: { fontSize: 18, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8 },
  saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: '600' }
});

