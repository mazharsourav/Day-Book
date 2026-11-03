import { SideBar, TabBar, type TabKey } from '@/components/ui/TabBar';
import { MOTION } from '@/constants/motion';
import { RN_EASE } from '@/constants/easing';
import { useTasks } from '@/context/DataContext';
import { useLayoutMode } from '@/hooks/useLayoutMode';
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
  const mode = useLayoutMode();
  const routes = state.routes.filter((r) => KEY_FOR_ROUTE[r.name] !== undefined);
  const active = KEY_FOR_ROUTE[state.routes[state.index].name] ?? 'today';

  const handlePress = (key: TabKey) => {
    const route = routes.find((r) => KEY_FOR_ROUTE[r.name] === key);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (key !== active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  const Bar = mode === 'wide' ? SideBar : TabBar;
  return (
    <Bar
      tabs={routes.map((r) => KEY_FOR_ROUTE[r.name])}
      active={active}
      onPress={handlePress}
      openToday={openCountOn(tasks, today)}
    />
  );
}

export default function TabLayout() {
  // From 900 wide the tabs move to a side bar on the left (board frame H).
  const mode = useLayoutMode();
  return (
    <Tabs
      // Switching tabs cross-fades the content (motion table: fast, no sliding).
      screenOptions={{
        tabBarPosition: mode === 'wide' ? 'left' : 'bottom',
        headerShown: false,
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: MOTION.tabFade, easing: RN_EASE } },
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
