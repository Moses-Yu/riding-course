import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Image, Platform } from 'react-native';
import { TAGS as ALL_TAGS, SURFACE_OPTIONS, TRAFFIC_OPTIONS } from './constants';
import PasteBox from '../components/PasteBox';
// @ts-ignore - optional dependency on native; on web will be unused
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function RouteCreate() {
  const router = useRouter();
  const [parsed, setParsed] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [starsScenery, setStarsScenery] = useState(0);
  const [starsDifficulty, setStarsDifficulty] = useState(0);
  const TAGS = ALL_TAGS;
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
  const [photos, setPhotos] = useState<{ uri: string; name?: string; type?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [surface, setSurface] = useState<'unknown' | 'good' | 'rough'>('unknown');
  const [traffic, setTraffic] = useState<'unknown' | 'low' | 'medium' | 'high'>('unknown');
  const [speedbump, setSpeedbump] = useState<number>(0);
  const [enforcement, setEnforcement] = useState<number>(0);
  const [signal, setSignal] = useState<number>(0);

  const handleParsed = (raw: string, p?: any) => {
    setParsed(p ?? null);
    if (p?.dest?.name && p?.start?.name) {
      const suggestion = `${p.start.name} → ${p.dest.name}`;
      if (!title) setTitle(suggestion);
    }
  };

  const handleSave = async () => {
    if (!parsed || saving) return;
    setSaving(true);
    const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
    const form = new FormData();
    form.append('title', title || 'Untitled');
    if (summary) form.append('summary', summary);
    form.append('open_url', parsed.openUrl);
    if (parsed.nmapUrl) form.append('nmap_url', parsed.nmapUrl);
    if (starsScenery) form.append('stars_scenery', String(starsScenery));
    if (starsDifficulty) form.append('stars_difficulty', String(starsDifficulty));
    if (surface) form.append('surface', surface);
    if (traffic) form.append('traffic', traffic);
    if (speedbump) form.append('speedbump', String(speedbump));
    if (enforcement) form.append('enforcement', String(enforcement));
    if (signal) form.append('signal', String(signal));
    const mask = Array.from(selectedTags).reduce((acc, idx)=> acc | (1 << idx), 0);
    if (mask) form.append('tags_bitmask', String(mask));
    if (parsed.dest) {
      const points: any[] = [];
      if (parsed.start) points.push({ lat: parsed.start.lat, lng: parsed.start.lng, name: parsed.start.name });
      for (const w of parsed.waypoints || []) points.push({ lat: w.lat, lng: w.lng, name: w.name });
      points.push({ lat: parsed.dest.lat, lng: parsed.dest.lng, name: parsed.dest.name });
      form.append('points', JSON.stringify(points));
    }
    for (const p of photos) {
      const anyP: any = p as any;
      if (anyP._file) {
        // Web: append the actual File object
        form.append('photos', anyP._file, p.name || 'photo.jpg');
      } else {
        // Native: use the React Native file descriptor shape
        const file: any = { uri: p.uri, name: p.name || 'photo.jpg', type: p.type || 'image/jpeg' };
        form.append('photos', file as any);
      }
    }
    try {
      const res = await fetch(`${api}/routes/with-photos`, { method: 'POST', body: form, credentials: 'include' } as any);
      const text = await res.text();
      if (res.ok) {
        let data: any = null;
        try { data = JSON.parse(text); } catch {}
        const id = data?.id;
        if (id) {
          router.replace({ pathname: '/route-detail', params: { id: String(id) } });
        } else {
          alert('Saved');
        }
      } else {
        alert(`Error: ${text}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const pickImages = async () => {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { alert('사진 권한이 필요합니다'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
      if (!result.canceled) {
        const assets = (result as any).assets || [];
        const mapped = assets.map((a: any) => ({ uri: a.uri, name: a.fileName || 'photo.jpg', type: a.type || 'image/jpeg' }));
        setPhotos([...photos, ...mapped]);
      }
    } else {
      // Web: create an invisible input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      (input as any).multiple = true;
      input.onchange = () => {
        const files = (input.files || []) as any;
        const mapped: any[] = [];
        for (let i=0;i<files.length;i++) {
          const f = files[i];
          const url = URL.createObjectURL(f);
          mapped.push({ uri: url, name: f.name, type: f.type || 'image/jpeg', _file: f });
        }
        setPhotos([...photos, ...mapped]);
      };
      input.click();
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <PasteBox onParsed={handleParsed} />
      {parsed && (
        <View style={[styles.card, { gap: 8 }]}> 
          <Text style={styles.previewTitle}>미리보기</Text>
          <Text>모드: {parsed.modality}</Text>
          {parsed.start && <Text>출발: {parsed.start.name ?? ''} ({parsed.start.lat}, {parsed.start.lng})</Text>}
          {(parsed.waypoints ?? []).map((w: any, i: number) => (
            <Text key={i}>경유{i+1}: {w.name ?? ''} ({w.lat}, {w.lng})</Text>
          ))}
          {parsed.dest && <Text>도착: {parsed.dest.name ?? ''} ({parsed.dest.lat}, {parsed.dest.lng})</Text>}
        </View>
      )}
      <View style={{ gap: 8 }}>
        <TextInput style={styles.input} placeholder="제목" value={title} onChangeText={setTitle} maxLength={60} />
        <Text style={styles.helperText}>{title.length}/60</Text>
        <TextInput style={styles.input} placeholder="요약" value={summary} onChangeText={setSummary} maxLength={200} multiline />
        <Text style={styles.helperText}>{summary.length}/200</Text>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={styles.sectionTitle}>평가</Text>
        <View style={styles.row}><Text style={{ width: 90 }}>경치</Text><StarBar value={starsScenery} onChange={setStarsScenery} /></View>
        <View style={styles.row}><Text style={{ width: 90 }}>난이도</Text><StarBar value={starsDifficulty} onChange={setStarsDifficulty} /></View>
        <View style={styles.row}><Text style={{ width: 90 }}>노면</Text>
          <Segmented
            options={SURFACE_OPTIONS}
            value={surface}
            onChange={setSurface}
          />
        </View>
        <View style={styles.row}><Text style={{ width: 90 }}>교통량</Text>
          <Segmented
            options={TRAFFIC_OPTIONS}
            value={traffic}
            onChange={setTraffic}
          />
        </View>
        <View style={styles.row}><Text style={{ width: 90 }}>범퍼</Text>
          <Counter value={speedbump} onChange={setSpeedbump} />
        </View>
        <View style={styles.row}><Text style={{ width: 90 }}>단속</Text>
          <Counter value={enforcement} onChange={setEnforcement} />
        </View>
        <View style={styles.row}><Text style={{ width: 90 }}>신호</Text>
          <Counter value={signal} onChange={setSignal} />
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={styles.sectionTitle}>태그 <Text style={{ color: '#6b7280' }}>({selectedTags.size} 선택됨)</Text></Text>
        <View style={styles.rowWrap}>
          {TAGS.map((t, i)=>{
            const active = selectedTags.has(i);
            return (
              <TouchableOpacity key={t} onPress={()=>{
                const next = new Set(selectedTags);
                if (next.has(i)) next.delete(i); else next.add(i);
                setSelectedTags(next);
              }} style={[styles.tag, active && styles.tagActive]}>
                <Text style={active ? styles.tagActiveText : styles.tagText}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={styles.sectionTitle}>사진</Text>
        <View style={[styles.rowWrap, { alignItems: 'center' }]}>
          {photos.map((p, idx) => (
            <View key={idx} style={styles.photoThumb}>
              <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} />
              <TouchableOpacity onPress={() => setPhotos(prev => prev.filter((_, i) => i !== idx))} style={styles.removeBadge}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={pickImages} style={[styles.addPhotoBtn]}> 
            <Text style={{ fontSize: 24, lineHeight: 24 }}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <TouchableOpacity disabled={!parsed || saving} onPress={handleSave} style={[styles.saveBtn, (!parsed || saving) && styles.saveBtnDisabled]}>
          <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '저장'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={[styles.cancelBtn]}>
          <Text style={styles.cancelBtnText}>취소</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, backgroundColor: '#fafafa' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  previewTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  helperText: { color: '#6b7280', fontSize: 12, marginTop: -6 },
  saveBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8 },
  saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  saveBtnDisabled: { backgroundColor: '#93c5fd' },
  cancelBtn: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8 },
  cancelBtnText: { color: '#111827', textAlign: 'center', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#000' },
  tagActive: { backgroundColor: '#000' },
  tagText: { color: '#000' },
  tagActiveText: { color: '#fff' },
  addPhotoBtn: { width: 72, height: 72, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  photoThumb: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', position: 'relative' },
  removeBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#111827', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }
});

function StarBar({ value, onChange }: { value: number; onChange: (v:number)=>void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1,2,3,4,5].map(n => (
        <TouchableOpacity key={n} onPress={()=>onChange(n)}>
          <Text style={{ fontSize: 18 }}>{n <= value ? '★' : '☆'}</Text>
        </TouchableOpacity>
      ))}
      {value>0 && (
        <TouchableOpacity onPress={()=>onChange(0)}><Text style={{ color: '#888', marginLeft: 6 }}>지우기</Text></TouchableOpacity>
      )}
    </View>
  );
}

function Segmented<T extends string>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T; onChange: (v: T)=>void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <TouchableOpacity key={opt.value} onPress={()=>onChange(opt.value)} style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb' }, active && { backgroundColor: '#111827', borderColor: '#111827' }]}>
            <Text style={[{ fontSize: 12 }, active ? { color: '#fff' } : { color: '#111827' }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Counter({ value, onChange }: { value: number; onChange: (v: number)=>void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <TouchableOpacity onPress={()=>onChange(Math.max(0, value - 1))} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Text>-</Text>
      </TouchableOpacity>
      <Text style={{ minWidth: 24, textAlign: 'center' }}>{value}</Text>
      <TouchableOpacity onPress={()=>onChange(value + 1)} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Text>+</Text>
      </TouchableOpacity>
    </View>
  );
}

