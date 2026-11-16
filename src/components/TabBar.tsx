import type { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const LABELS: Record<string, string> = {
  trending: 'Trending',
  '(rezy)': 'Rezy',
  my: 'My',
};

// 하단 탭 바 — Trending / Rezy / My
export function TabBar({ state, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;

        return (
          <Pressable
            key={route.key}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => navigateToTab(route.key)}
          >
            <Text style={[styles.label, focused && styles.labelFocused]}>
              {LABELS[route.name] ?? route.name}
            </Text>
            {focused && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.ivory,
    borderBottomWidth: 1,
    borderBottomColor: '#C9C7CF',
  },
  item: {
    flex: 1,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 21,
    fontWeight: '500',
    color: colors.tabInactive,
  },
  labelFocused: {
    color: colors.tabActive,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: 44,
    height: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: colors.tabActive,
  },
});
