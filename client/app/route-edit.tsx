import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TAGS as ALL_TAGS, SURFACE_OPTIONS, TRAFFIC_OPTIONS } from './constants';

export default function RouteEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any | null>(null);
  const [routeData, setRouteData] = useState<any | null>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [starsScenery, setStarsScenery] = useState(0);
  const [starsDifficulty, setStarsDifficulty] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
  const [surface, setSurface] = useState<'unknown' | 'good' | 'rough'>('unknown');
  const [traffic, setTraffic] = useState<'unknown' | 'low' | 'medium' | 'high'>('unknown');
  const [speedbump, setSpeedbump] = useState<number>(0);
  const [enforcement, setEnforcement] = useState<number>(0);
  const [signal, setSignal] = useState<number>(0);
  const TAGS = ALL_TAGS;

  useEffect(() => {
    const run = async () => {
      try {
        const [meRes, routeRes] = await Promise.all([
          fetch(`${api}/auth/me`, { credentials: 'include' }),
          fetch(`${api}/routes/${id}`),
        ]);
        setMe(meRes.ok ? await meRes.json() : null);
        const routeJson = await routeRes.json();
        setRouteData(routeJson);
        setTitle(routeJson.title || '');
        setSummary(routeJson.summary || '');
        setStarsScenery(routeJson.stars_scenery || 0);
        setStarsDifficulty(routeJson.stars_difficulty || 0);
        const mask = routeJson.tags_bitmask || 0;
        const set = new Set<number>();
        for (let i=0;i<TAGS.length;i++) if (mask & (1<<i)) set.add(i);
        setSelectedTags(set);
        setSurface((routeJson.surface || 'unknown') as any);
        setTraffic((routeJson.traffic || 'unknown') as any);
        setSpeedbump(routeJson.speedbump || 0);
        setEnforcement(routeJson.enforcement || 0);
        setSignal(routeJson.signal || 0);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [api, id]);

  const canEdit = useMemo(() => {
    if (!routeData || !me) return false;
    return routeData.author_id === me.id;
  }, [routeData, me]);

  const onSave = useCallback(async () => {
    if (!id) return;
    const body: any = {
      title,
      summary,
      stars_scenery: starsScenery || null,
      stars_difficulty: starsDifficulty || null,
      surface,
      traffic,
      speedbump,
      enforcement,
      signal,
      tags_bitmask: Array.from(selectedTags).reduce((acc, idx)=> acc | (1<<idx), 0) || null,
    };
    const res = await fetch(`${api}/routes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status === 401) Alert.alert('로그인이 필요합니다');
      else if (res.status === 403) Alert.alert('수정 권한이 없습니다');
      else Alert.alert('수정에 실패했습니다');
      return;
    }
    const data = await res.json();
    router.replace({ pathname: '/route-detail', params: { id: String(data.id) } });
  }, [api, id, title, summary, starsScenery, starsDifficulty, selectedTags, router]);

  if (loading || !routeData) return <View style={{ padding: 16 }}><Text>Loading...</Text></View> as any;
  if (!canEdit) return <View style={{ padding: 16 }}><Text>수정 권한이 없습니다.</Text></View> as any;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <View style={{ gap: 8 }}>
        <TextInput style={styles.input} placeholder="제목" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="요약" value={summary} onChangeText={setSummary} />
      </View>
      <View style={{ gap: 8 }}>
        <Text style={styles.sectionTitle}>평가</Text>
        <View style={styles.row}><Text style={{ width: 90 }}>경치</Text><StarBar value={starsScenery} onChange={setStarsScenery} /></View>
        <View style={styles.row}><Text style={{ width: 90 }}>난이도</Text><StarBar value={starsDifficulty} onChange={setStarsDifficulty} /></View>
        <View style={styles.row}><Text style={{ width: 90 }}>노면</Text>
          <Segmented options={SURFACE_OPTIONS} value={surface} onChange={setSurface} />
        </View>
        <View style={styles.row}><Text style={{ width: 90 }}>교통량</Text>
          <Segmented options={TRAFFIC_OPTIONS} value={traffic} onChange={setTraffic} />
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
        <Text style={styles.sectionTitle}>태그</Text>
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
      <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>수정 저장</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

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

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#000' },
  tagActive: { backgroundColor: '#000' },
  tagText: { color: '#000' },
  tagActiveText: { color: '#fff' },
  saveBtn: { backgroundColor: '#111827', padding: 12, borderRadius: 8 },
  saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});

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


