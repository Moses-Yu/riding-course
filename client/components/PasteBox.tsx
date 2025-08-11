import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';

export default function PasteBox({ onParsed }: { onParsed: (raw: string, parsed?: any) => void }) {
  const [raw, setRaw] = useState('');
  const [parsing, setParsing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    setRaw(text);
    await tryParse(text);
  };

  const tryParse = async (text: string) => {
    if (!text.trim()) return;
    setParsing(true);
    setStatus('parsing');
    setErrorMessage(null);
    try {
      const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
      const res = await fetch(`${api}/routes/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: text })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onParsed(text, data);
      setStatus('success');
    } catch (e: any) {
      Alert.alert('Parse failed', e.message || String(e));
      onParsed(text);
      setStatus('error');
      setErrorMessage(e?.message ? String(e.message) : 'Unknown error');
    } finally {
      setParsing(false);
    }
  };

  // Auto-parse shortly after user pastes/types a link
  useEffect(() => {
    if (!raw || parsing) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    // Heuristic: looks like a URL or contains map keywords
    const looksUrl = /https?:\/\//i.test(raw) || /naver|nmap|map\.naver/i.test(raw);
    if (!looksUrl) return;
    timerRef.current = setTimeout(() => {
      tryParse(raw);
    }, 600);
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [raw]);

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsTitle}>네이버 지도 링크 붙여넣기</Text>
        <View style={{ gap: 4 }}>
          <Text style={styles.instructionLine}>1) 네이버 지도에서 길찾기 생성</Text>
          <Text style={styles.instructionLine}>2) 공유 {'>'} 링크 복사</Text>
          <Text style={styles.instructionLine}>3) 아래 입력창에 붙여넣기하면 자동으로 파싱돼요</Text>
        </View>
      </View>
      <TextInput
        style={styles.input}
        placeholder="여기에 붙여넣기"
        value={raw}
        onChangeText={(t)=>setRaw(t)}
        onBlur={()=>tryParse(raw)}
        multiline
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ minHeight: 24, justifyContent: 'center' }}>
          {parsing && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#6b7280" size="small" />
              <Text style={{ color: '#6b7280' }}>파싱 중…</Text>
            </View>
          )}
          {!parsing && status === 'success' && (
            <Text style={{ color: '#059669' }}>✅ 파싱 성공</Text>
          )}
          {!parsing && status === 'error' && (
            <Text numberOfLines={1} style={{ color: '#dc2626', maxWidth: 220 }}>파싱 실패: {errorMessage}</Text>
          )}
        </View>
        <TouchableOpacity onPress={handlePaste} style={[styles.btn, { backgroundColor: '#111827' }]}> 
          <Text style={{ color: '#fff', fontWeight: '600' }}>클립보드 붙여넣기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  instructionsBox: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 8, padding: 12 },
  instructionsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  instructionLine: { color: '#374151' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, minHeight: 96 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }
});

