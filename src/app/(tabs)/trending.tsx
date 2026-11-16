import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

// Trending 탭 — 화면 틀만 (동작 없음)
export default function TrendingScreen() {
  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
});
