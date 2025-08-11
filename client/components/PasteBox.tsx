import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

export default function PasteBox({ onParsed }: { onParsed: (raw: string, parsed?: any) => void }) {
  const [raw, setRaw] = useState('');
  const [parsing, setParsing] = useState(false);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    setRaw(text);
    await tryParse(text);
  };

  const tryParse = async (text: string) => {
    if (!text.trim()) return;
    setParsing(true);
    try {
      const res = await fetch(process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api/routes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: text })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onParsed(text, data);
    } catch (e: any) {
      Alert.alert('Parse failed', e.message || String(e));
      onParsed(text);
    } finally {
      setParsing(false);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 16 }}>1) 네이버 지도에서 길찾기 생성 → 2) 공유 > 링크 복사 → 3) 아래에 붙여넣기</Text>
      <TextInput
        style={styles.input}
        placeholder="여기에 붙여넣기"
        value={raw}
        onChangeText={(t)=>setRaw(t)}
        onBlur={()=>tryParse(raw)}
        multiline
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={handlePaste} style={[styles.btn, { backgroundColor: '#000' }]}>
          <Text style={{ color: '#fff' }}>클립보드 붙여넣기</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={parsing} onPress={()=>tryParse(raw)} style={[styles.btn, { backgroundColor: '#444' }]}>
          <Text style={{ color: '#fff' }}>파싱</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, minHeight: 96 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }
});

