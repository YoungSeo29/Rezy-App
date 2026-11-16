import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getStores } from '@/api';
import { errorMessage } from '@/api/client';
import type { StoreSummary } from '@/api/types';
import { ResultPopup } from '@/components/ResultPopup';
import { colors } from '@/constants/theme';

const PAGE_SIZE = 20;

// "서울 마포구 성미산로 143 1층" → "서울 마포구"
function shortAddress(address: string): string {
  return address.trim().split(/\s+/).slice(0, 2).join(' ');
}

export default function StoreListScreen() {
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [popup, setPopup] = useState<string | null>(null);
  const nextPage = useRef(0);
  const hasMore = useRef(true);
  const loading = useRef(false);

  const loadMore = useCallback(async () => {
    if (loading.current || !hasMore.current) return;
    loading.current = true;
    try {
      const res = await getStores(nextPage.current, PAGE_SIZE);
      setStores((prev) => (nextPage.current === 0 ? res.content : [...prev, ...res.content]));
      nextPage.current += 1;
      hasMore.current = nextPage.current < res.page.totalPages;
    } catch (e) {
      hasMore.current = false;
      setPopup(errorMessage(e));
    } finally {
      loading.current = false;
    }
  }, []);

  useEffect(() => {
    void loadMore();
  }, [loadMore]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* 검색창 — 화면 틀만 (동작 없음) */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="식당 이름으로 검색"
          placeholderTextColor={colors.placeholder}
        />
        <Pressable style={styles.searchButton}>
          <Text style={styles.searchButtonText}>검색</Text>
        </Pressable>
      </View>
      <View style={styles.divider} />

      <FlatList
        data={stores}
        keyExtractor={(item) => item.storeId}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/store/[storeId]', params: { storeId: item.storeId } })
            }
          >
            <View style={styles.photo} />
            <Text style={styles.storeName} numberOfLines={1}>
              {item.storeName}
            </Text>
            <Text style={styles.storeAddress} numberOfLines={1}>
              {shortAddress(item.address)}
            </Text>
          </Pressable>
        )}
      />
      <ResultPopup message={popup} onClose={() => setPopup(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 22,
    paddingBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#A9A9A9',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    fontSize: 19,
    color: colors.text,
  },
  searchButton: {
    width: 64,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: { fontSize: 19, color: '#3A3A3A' },
  divider: { height: 1, backgroundColor: colors.text },
  list: { paddingHorizontal: 35, paddingTop: 20, paddingBottom: 20 },
  row: { justifyContent: 'space-between' },
  card: { width: '47%', marginBottom: 26 },
  photo: {
    width: '100%',
    aspectRatio: 275 / 245,
    borderRadius: 24,
    backgroundColor: colors.photo,
  },
  storeName: { marginTop: 12, marginLeft: 12, fontSize: 15, color: colors.textSub },
  storeAddress: { marginTop: 6, marginLeft: 12, fontSize: 11, color: colors.textSub },
});
