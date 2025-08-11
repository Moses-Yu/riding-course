import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';

export default function My() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [myRoutes, setMyRoutes] = useState<any[]>([]);
  const [me, setMe] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';

  const load = async () => {
    try {
      const r = await fetch(`${api}/auth/me`, { credentials: 'include' });
      if (r.ok) {
        const u = await r.json();
        setMe(u);
        const [b, mine] = await Promise.all([
          fetch(`${api}/bookmarks/`, { credentials: 'include' }),
          fetch(`${api}/routes/mine`, { credentials: 'include' })
        ]);
        if (b.ok) setItems(await b.json());
        if (mine.ok) setMyRoutes(await mine.json());
      } else {
        setMe(null);
        setMyRoutes([]);
      }
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const onLogin = async () => {
    try {
      const r = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      if (!r.ok) throw new Error('로그인 실패');
      setEmail(''); setPassword('');
      await load();
    } catch (e:any) {
      Alert.alert('Error', e.message || String(e));
    }
  };

  const onRegister = async () => {
    try {
      const r = await fetch(`${api}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!r.ok) throw new Error('회원가입 실패');
      await onLogin();
    } catch (e:any) {
      Alert.alert('Error', e.message || String(e));
    }
  };

  const onLogout = async () => {
    await fetch(`${api}/auth/logout`, { method: 'POST', credentials: 'include' });
    setMe(null); setItems([]); setMyRoutes([]);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={typeof document === 'undefined' ? (
        <RefreshControl refreshing={false} onRefresh={load} />
      ) : undefined}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>My</Text>
      {!me ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: '#555' }}>로그인 후 북마크/댓글/좋아요가 가능합니다.</Text>
          <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }} />
          <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={onLogin} style={{ flex: 1, backgroundColor: '#000', padding: 12, borderRadius: 8 }}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>router.push('/register')} style={{ flex: 1, backgroundColor: '#444', padding: 12, borderRadius: 8 }}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Text>안녕하세요, {me.display_name || me.email}</Text>
          <TouchableOpacity onPress={onLogout} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8 }}>
            <Text>로그아웃</Text>
          </TouchableOpacity>
          <Text style={{ color: '#555' }}>내가 올린 코스</Text>
          {myRoutes.length === 0 && (
            <Text style={{ color: '#888' }}>아직 올린 코스가 없습니다.</Text>
          )}
          {myRoutes.map((it)=> (
            <TouchableOpacity key={`mine-${it.id}`} onPress={()=>router.push({ pathname: '/route-detail', params: { id: String(it.id) } })} style={{ borderWidth: 1, borderRadius: 8, padding: 12, borderColor: '#ddd' }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>{it.title}</Text>
              {it.summary ? <Text style={{ color: '#555', marginTop: 4 }}>{it.summary}</Text> : null}
            </TouchableOpacity>
          ))}
          <Text style={{ color: '#555', marginTop: 16 }}>북마크한 코스</Text>
          {items.map((it)=> (
            <TouchableOpacity key={`bm-${it.id}`} onPress={()=>router.push({ pathname: '/route-detail', params: { id: String(it.id) } })} style={{ borderWidth: 1, borderRadius: 8, padding: 12, borderColor: '#ddd' }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>{it.title}</Text>
              {it.summary ? <Text style={{ color: '#555', marginTop: 4 }}>{it.summary}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

