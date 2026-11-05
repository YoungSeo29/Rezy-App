import { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';

const BASE_URL = 'http://192.168.29.247:8080';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');

  const login = async () => {
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(`로그인 실패 (${res.status})`);
      const data = await res.json();
      setToken(data.accessToken);
      await loadReservations(data.accessToken);
    } catch (e) {
      setError(e.message);
    }
  };

  const loadReservations = async (accessToken) => {
    const res = await fetch(`${BASE_URL}/api/reservations/me?type=UPCOMING`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`예약 조회 실패 (${res.status})`);
    setReservations(await res.json());
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Rezy</Text>
        <TextInput style={styles.input} placeholder="이메일" autoCapitalize="none"
          keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry
          value={password} onChangeText={setPassword} />
        <Button title="로그인" onPress={login} />
        {!!error && <Text style={styles.error}>{error}</Text>}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>다가오는 예약</Text>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.reservationId}
        ListEmptyComponent={<Text>예약이 없음</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.store}>{item.storeName}</Text>
            <Text>{item.slotDatetime.replace('T', ' ').slice(0, 16)} · {item.partySize}명</Text>
            <Text style={styles.sub}>{item.storeAddress} · {item.status}</Text>
          </View>
        )}
      />
      <Button title="로그아웃" onPress={() => { setToken(null); setReservations([]); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  error: { color: 'red', marginTop: 12 },
  card: { padding: 14, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 10 },
  store: { fontSize: 16, fontWeight: '600' },
  sub: { color: '#888', marginTop: 4 },
});