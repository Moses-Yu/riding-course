import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RouteItem = {
  id: number;
  title: string;
  summary?: string;
  region1?: string;
  like_count: number;
  comment_count: number;
  stars_scenery?: number;
  stars_difficulty?: number;
  tags_bitmask?: number;
  has_photos?: boolean;
};

export default function Home() {
  const router = useRouter();
  const [items, setItems] = useState<RouteItem[]>([]);
  const [region1, setRegion1] = useState('');
  const [sort, setSort] = useState<'popular' | 'comments' | 'latest' | 'opens'>('popular');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debouncedRegion, setDebouncedRegion] = useState('');

  const load = async () => {
    const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
    const q = new URLSearchParams();
    if (debouncedRegion) q.set('region1', debouncedRegion);
    if (sort) q.set('sort', sort);
    try {
      setErrorMessage(null);
      setIsLoading(true);
    const res = await fetch(`${api}/routes?${q.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data);
    } catch (e: any) {
      setErrorMessage(e?.message ? String(e.message) : '목록을 불러오지 못했어요');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce region input to avoid excessive queries while typing
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedRegion(region1.trim()), 350);
    return () => clearTimeout(handle);
  }, [region1]);

  useEffect(() => { load(); }, [debouncedRegion, sort]);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await load();
    } finally {
      setIsRefreshing(false);
    }
  };

  const webShadowCard = useMemo(() => (Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } : undefined), []);
  const webShadowFab = useMemo(() => (Platform.OS === 'web' ? { boxShadow: '0 6px 10px rgba(0,0,0,0.15)' } : undefined), []);
  const nativeShadowCard = useMemo(() => (Platform.OS !== 'web' ? {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  } : undefined), []);
  const nativeShadowFab = useMemo(() => (Platform.OS !== 'web' ? {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  } : undefined), []);

  return (
    <SafeAreaView style={styles.container}>
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <TextInput
          placeholder="지역으로 검색"
          value={region1}
          onChangeText={setRegion1}
          style={[styles.input, { flex: 1 }]}
          returnKeyType="search"
          onSubmitEditing={() => {
            setDebouncedRegion(region1.trim());
            // ensure fresh load on submit
            load();
          }}
          autoCorrect={false}
          autoCapitalize="none"
          placeholderTextColor="#9ca3af"
        />
        {region1.length > 0 && (
          <TouchableOpacity onPress={() => setRegion1('')} style={styles.clearBtn}>
            <Text style={{ fontWeight: '600' }}>지우기</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.rowWrap}>
        {([
          { key: 'popular', label: '인기' },
          { key: 'comments', label: '댓글' },
          { key: 'latest', label: '최신' },
          { key: 'opens', label: '열람' },
        ] as const).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setSort(key as typeof sort)}
            style={[styles.chip, sort === key && styles.chipActive]}
          >
            <Text style={sort === (key as typeof sort) ? styles.chipActiveText : styles.chipText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {isLoading ? '불러오는 중…' : `총 ${items.length}건`}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 96 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={Platform.OS === 'web' ? undefined : (
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        )}
      >
        {isLoading && items.length === 0 ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2, 3, 4].map((n) => (
              <View key={n} style={styles.skeletonCard} />
            ))}
          </View>
        ) : null}

        {!isLoading && items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
            <Text style={styles.emptyText}>다른 지역을 입력하거나 정렬을 변경해 보세요.</Text>
          </View>
        ) : null}

        {items.map((it) => (
          <TouchableOpacity
            key={it.id}
            style={[styles.card, webShadowCard, nativeShadowCard]}
            onPress={() => router.push({ pathname: '/route-detail', params: { id: String(it.id) } })}
            activeOpacity={0.8}
            accessibilityRole="button"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View>
              <Text style={styles.cardTitle} numberOfLines={1}>{it.title}</Text>
              {it.summary ? (
                <Text style={styles.cardSummary} numberOfLines={2}>{it.summary}</Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                {it.stars_scenery ? (
                  <Text style={styles.badge}>경치 {'★'.repeat(Math.max(0, Math.min(5, it.stars_scenery)))}</Text>
                ) : null}
                {it.stars_difficulty ? (
                  <Text style={styles.badge}>난이도 {'★'.repeat(Math.max(0, Math.min(5, it.stars_difficulty)))}</Text>
                ) : null}
              </View>
              <View style={styles.metaBadgesRow}>
                {it.region1 ? <Text style={styles.metaPill}>{it.region1}</Text> : null}
                <Text style={styles.metaPill}>❤ {it.like_count}</Text>
                <Text style={styles.metaPill}>💬 {it.comment_count}</Text>
                {it.has_photos ? <Text style={styles.metaPill}>📷</Text> : null}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.push('/route-create')}
        style={[styles.fab, webShadowFab, nativeShadowFab]}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋ 코스 등록</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: '#f6f7f9' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { color: '#667085', fontSize: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 10, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { color: '#111827' },
  chipActiveText: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eef0f3',
    // native shadows (no-op on web)
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  skeletonCard: {
    height: 84,
    borderRadius: 12,
    backgroundColor: '#eef0f3',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardSummary: { color: '#6b7280', marginTop: 6 },
  badge: { fontSize: 12, color: '#374151' },
  metaBadgesRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  metaPill: { fontSize: 12, color: '#374151', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f3f4f6', borderRadius: 999 },
  errorBanner: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 10 },
  errorText: { color: '#b91c1c' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { fontWeight: '700', color: '#111827' },
  emptyText: { color: '#6b7280' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    // native shadows (no-op on web)
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  fabText: { color: '#fff', fontWeight: '700' },
});

