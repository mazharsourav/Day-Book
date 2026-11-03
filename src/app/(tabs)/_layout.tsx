import { TabBar, type TabKey } from '@/components/ui/TabBar';
import { MOTION } from '@/constants/motion';
import { useTasks } from '@/context/DataContext';
import { useToday } from '@/hooks/useToday';
import { openCountOn } from '@/utils/tasks';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

// Route file names and the tabs they stand for.
const KEY_FOR_ROUTE: Record<string, TabKey> = { index: 'today', week: 'week', history: 'history', settings: 'settings' };

// The app's own tab bar from the board. Only the tabs that have a screen are shown.
function AppTabBar({ state, navigation }: TabBarProps) {
  const { tasks } = useTasks();
  const today = useToday();
  const routes = state.routes.filter((r) => KEY_FOR_ROUTE[r.name] !== undefined);
  const active = KEY_FOR_ROUTE[state.routes[state.index].name] ?? 'today';

  const handlePress = (key: TabKey) => {
    const route = routes.find((r) => KEY_FOR_ROUTE[r.name] === key);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (key !== active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  return (
    <TabBar
      tabs={routes.map((r) => KEY_FOR_ROUTE[r.name])}
      active={active}
      onPress={handlePress}
      openToday={openCountOn(tasks, today)}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      // Switching tabs cross-fades the content (motion table: 150 ms, no sliding).
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: MOTION.tabFade } },
      }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="week" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
