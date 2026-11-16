import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useSession } from '@/context/session';

const WELCOME_MS = 1500;

export default function WelcomeScreen() {
  const { finishWelcome } = useSession();

  // 잠깐 보여준 뒤 가게 목록으로 넘어간다
  useEffect(() => {
    const timer = setTimeout(finishWelcome, WELCOME_MS);
    return () => clearTimeout(timer);
  }, [finishWelcome]);

  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Rezy에 오신 것을{'\n'}환영합니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '18%',
  },
  text: {
    fontSize: 20,
    lineHeight: 34,
    letterSpacing: 2,
    color: colors.text,
    textAlign: 'center',
  },
});
