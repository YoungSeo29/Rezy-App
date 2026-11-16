import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { SessionProvider, useSession } from '@/context/session';

const SPLASH_MIN_MS = 1500;

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { isLoading, token, needsProfile, showWelcome } = useSession();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !splashDone) return <Splash />;

  const signedIn = !!token;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && needsProfile}>
        <Stack.Screen name="profile" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !needsProfile && showWelcome}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !needsProfile && !showWelcome}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashText}>Rezy에서{'\n'}원하는 식당을 예약하세요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '18%',
  },
  splashText: {
    fontSize: 20,
    lineHeight: 34,
    letterSpacing: 2,
    color: colors.text,
    textAlign: 'center',
  },
});
