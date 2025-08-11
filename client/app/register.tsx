import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

type MotoCategoryKey = '네이키드' | '투어러' | '스포츠' | '스쿠터';

const MOTO_MASTER: Record<MotoCategoryKey, { brand: string; models: string[] }[]> = {
  네이키드: [
    { brand: 'Honda', models: ['CB500F', 'CB650R', 'CB1000R'] },
    { brand: 'Yamaha', models: ['MT-03', 'MT-07', 'MT-09'] },
    { brand: 'Kawasaki', models: ['Z400', 'Z650', 'Z900'] },
    { brand: 'BMW', models: ['F 900 R', 'S 1000 R', 'R nineT'] },
    { brand: 'Suzuki', models: ['GSX-8S'] },
    { brand: 'Triumph', models: ['Trident 660', 'Street Triple 765'] },
    { brand: 'KTM', models: ['390 Duke', '790 Duke', '1290 Super Duke R'] },
    { brand: 'Royal Enfield', models: ['Interceptor 650', 'Continental GT 650'] },
    { brand: 'Brixton', models: ['Cromwell 1200', 'Cromwell 500', 'Cromwell 250', 'Crossfire 500', 'Crossfire 500X'] },
  ],
  투어러: [
    { brand: 'BMW', models: ['R 1300 GS', 'F 900 XR', 'R 1250 RT'] },
    { brand: 'Honda', models: ['NT1100', 'Gold Wing'] },
    { brand: 'Kawasaki', models: ['Versys 650', 'Versys 1000', 'Ninja 1000SX'] },
    { brand: 'Yamaha', models: ['Tracer 7', 'Tracer 9 GT'] },
    { brand: 'Ducati', models: ['Multistrada V2', 'Multistrada V4'] },
    { brand: 'Triumph', models: ['Tiger Sport 660', 'Tiger 900', 'Tiger 1200'] },
    { brand: 'KTM', models: ['390 Adventure', '790 Adventure', '1290 Super Adventure'] },
    { brand: 'Suzuki', models: ['V-Strom 800DE', 'V-Strom 1050DE'] },
    { brand: 'Royal Enfield', models: ['Himalayan 450'] },
  ],
  스포츠: [
    { brand: 'Yamaha', models: ['YZF-R3', 'YZF-R7', 'YZF-R1'] },
    { brand: 'Honda', models: ['CBR500R', 'CBR600RR', 'CBR1000RR-R'] },
    { brand: 'Kawasaki', models: ['Ninja 400', 'Ninja 650', 'ZX-6R', 'ZX-10R'] },
    { brand: 'Suzuki', models: ['GSX-8R', 'GSX-R1000R'] },
    { brand: 'BMW', models: ['S 1000 RR'] },
    { brand: 'Ducati', models: ['Panigale V2', 'Panigale V4'] },
    { brand: 'KTM', models: ['RC 390'] },
    { brand: 'Triumph', models: ['Daytona Moto2 765'] },
  ],
  스쿠터: [
    { brand: 'Honda', models: ['PCX 125', 'ADV 160', 'Forza 350'] },
    { brand: 'Yamaha', models: ['NMAX 125', 'XMAX 300', 'Tricity 155'] },
    { brand: 'Vespa', models: ['Primavera 125', 'Sprint 150', 'GTS 300'] },
    { brand: 'BMW', models: ['C 400 X', 'C 400 GT'] },
    { brand: 'SYM', models: ['Jet 14 125', 'Joymax Z 300', 'Maxsym 400'] },
    { brand: 'KYMCO', models: ['Like 150i', 'Downtown 350', 'Xciting S 400'] },
    { brand: 'Suzuki', models: ['Burgman 400'] },
  ],
};

export default function Register() {
  const router = useRouter();
  const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [category, setCategory] = useState<MotoCategoryKey | null>(null);
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');

  const brandsForCategory = useMemo(() => {
    if (!category) return [] as string[];
    return MOTO_MASTER[category].map((b) => b.brand);
  }, [category]);

  const modelsForBrand = useMemo(() => {
    if (!category || !brand) return [] as string[];
    const found = MOTO_MASTER[category].find((b) => b.brand === brand);
    return found ? found.models : [];
  }, [category, brand]);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('필수 입력', '이메일과 비밀번호를 입력하세요.');
      return;
    }
    try {
      const r = await fetch(`${api}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, display_name: displayName.trim() || undefined }),
      });
      if (!r.ok) throw new Error(await r.text());
      // auto login
      const l = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      });
      if (!l.ok) throw new Error('로그인에 실패했습니다');
      Alert.alert('완료', '회원가입이 완료되었습니다.');
      router.replace('/my');
    } catch (e: any) {
      Alert.alert('오류', e?.message ? String(e.message) : '회원가입에 실패했습니다');
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>회원가입</Text>

      <View style={{ gap: 8 }}>
        <TextInput
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder="닉네임(선택)"
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.sectionTitle}>오토바이 선택(선택 사항)</Text>
        <View style={styles.rowWrap}>
          {(['네이키드', '투어러', '스포츠', '스쿠터'] as MotoCategoryKey[]).map((c) => {
            const active = category === c;
            return (
              <TouchableOpacity key={c} onPress={() => { setCategory(c); setBrand(''); setModel(''); }} style={[styles.chip, active && styles.chipActive]}>
                <Text style={active ? styles.chipActiveText : styles.chipText}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {category && (
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>브랜드</Text>
            <View style={styles.rowWrap}>
              {brandsForCategory.map((b) => {
                const active = brand === b;
                return (
                  <TouchableOpacity key={b} onPress={() => { setBrand(b); setModel(''); }} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={active ? styles.chipActiveText : styles.chipText}>{b}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput placeholder="직접 입력" value={brand} onChangeText={(t)=>{ setBrand(t); }} style={styles.input} />
          </View>
        )}

        {category && brand ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>모델</Text>
            <View style={styles.rowWrap}>
              {modelsForBrand.map((m) => {
                const active = model === m;
                return (
                  <TouchableOpacity key={m} onPress={() => setModel(m)} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={active ? styles.chipActiveText : styles.chipText}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput placeholder="직접 입력" value={model} onChangeText={setModel} style={styles.input} />
          </View>
        ) : null}
      </View>

      <TouchableOpacity onPress={submit} style={styles.submitBtn} activeOpacity={0.85}>
        <Text style={styles.submitText}>회원가입</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { color: '#111827' },
  chipActiveText: { color: '#fff' },
  label: { fontWeight: '600' },
  submitBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10 },
  submitText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});


