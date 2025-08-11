import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';

export default function PasteBox({ onParsed }: { onParsed: (raw: string, parsed?: any) => void }) {
  const [raw, setRaw] = useState('');
  const [parsing, setParsing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 16 }}>1) 네이버 지도에서 길찾기 생성 → 2) 공유 {'>'} 링크 복사 → 3) 아래에 붙여넣기</Text>
      <TextInput
        style={styles.input}
        placeholder="여기에 붙여넣기"
        value={raw}
        onChangeText={(t)=>setRaw(t)}
        onBlur={()=>tryParse(raw)}
        multiline
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={handlePaste} style={[styles.btn, { backgroundColor: '#000' }]}> 
          <Text style={{ color: '#fff' }}>클립보드 붙여넣기</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={parsing} onPress={()=>tryParse(raw)} style={[styles.btn, { backgroundColor: parsing ? '#6b7280' : '#444' }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {parsing && <ActivityIndicator color="#fff" size="small" />}
            <Text style={{ color: '#fff' }}>{parsing ? '파싱 중...' : '파싱'}</Text>
          </View>
        </TouchableOpacity>
        {status === 'success' && (
          <Text style={{ color: '#059669' }}>✅ 파싱 성공</Text>
        )}
        {status === 'error' && (
          <Text numberOfLines={1} style={{ color: '#dc2626', maxWidth: 180 }}>파싱 실패: {errorMessage}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, minHeight: 96 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }
});

