import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="trending" />
      <Tabs.Screen name="(rezy)" />
      <Tabs.Screen name="my" />
    </Tabs>
  );
}
