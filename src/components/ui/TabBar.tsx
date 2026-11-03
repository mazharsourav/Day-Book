import { AppLogo } from '@/components/AppLogo';
import { LAYOUT, TABLET } from '@/constants/layout';
import { COPY } from '@/constants/copy';
import { MOTION } from '@/constants/motion';
import { TYPE } from '@/constants/type';
import { EASE } from '@/constants/easing';
import { useColors } from '@/hooks/useColors';
import { badgeText, weekTabLabel } from '@/utils/a11y';
import { Calendar, CircleCheck, ListChecks, Settings, type LucideIcon } from 'lucide-react-native';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';

export type TabKey = 'today' | 'week' | 'history' | 'settings';

const APP_NAME = COPY.common.appName;

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'today', label: 'Today', icon: CircleCheck },
  { key: 'week', label: 'Week', icon: ListChecks },
  { key: 'history', label: 'History', icon: Calendar },
  { key: 'settings', label: 'Settings', icon: Settings },
];

interface TabBarProps {
  // Which tabs to show, in board order. Defaults to all four.
  tabs?: TabKey[];
  active: TabKey;
  onPress: (key: TabKey) => void;
  // Tasks still open today, shown as a small number on Week.
  openToday: number;
}

// The four tabs. The chosen one is darker with a thicker icon. The Week badge sits at the icon's corner.
export function TabBar({ tabs, active, onPress, openToday }: TabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const badge = badgeText(openToday);
  // On a portrait tablet the four tabs keep a phone's spread, centred (frames D to G).
  const side = Math.max(12, (width - TABLET.tabBarSpread) / 2);

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: c.line,
        backgroundColor: c.ground,
        paddingTop: LAYOUT.tabBarTopPadding,
        paddingHorizontal: side,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {TABS.filter((t) => !tabs || tabs.includes(t.key)).map(({ key, label, icon: Icon }) => {
        const on = key === active;
        const color = on ? c.text : c.muted;
        return (
          <Pressable
            key={key}
            onPress={() => onPress(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={key === 'week' ? weekTabLabel(openToday) : label}
            style={{ flex: 1, minHeight: LAYOUT.tabBarContent, alignItems: 'center', justifyContent: 'center', gap: 3 }}
          >
            <View>
              <Icon size={24} color={color} strokeWidth={on ? 2.25 : 1.75} />
              {key === 'week' && badge !== '' && (
                <Animated.View
                  key={badge}
                  entering={ZoomIn.duration(MOTION.badgePop).easing(EASE)}
                  style={{
                    position: 'absolute',
                    // The board puts it 5 above the icon and 8 right of the tab's centre.
                    top: -5,
                    left: 20,
                    minWidth: LAYOUT.badge,
                    height: LAYOUT.badge,
                    borderRadius: LAYOUT.badge / 2,
                    paddingHorizontal: 5,
                    backgroundColor: c.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0px 0px 0px 2px ${c.ground}`,
                  }}
                >
                  <AppText maxFontSizeMultiplier={1} style={[TYPE.tiny, { color: c.onAccent, fontWeight: '700' }]}>
                    {badge}
                  </AppText>
                </Animated.View>
              )}
            </View>
            <AppText style={[TYPE.tiny, { color }]}>{label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

// Wide tablets (900 and up, frames H and I): the same four tabs as a side bar with the logo.
// The chosen one sits on a grey pill; the Week number sits at the right of its row.
export function SideBar({ tabs, active, onPress, openToday }: TabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const badge = badgeText(openToday);

  return (
    <View
      accessibilityRole="tablist"
      style={{
        width: TABLET.sideBar + insets.left,
        borderRightWidth: 1,
        borderRightColor: c.line,
        backgroundColor: c.ground,
        paddingTop: insets.top + 18,
        paddingLeft: 12 + insets.left,
        paddingRight: 12,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 2, paddingHorizontal: 14, paddingBottom: 20 }}>
        <AppLogo size={30} look={c.scheme} />
        <AppText style={{ fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.38 }}>{APP_NAME}</AppText>
      </View>
      {TABS.filter((t) => !tabs || tabs.includes(t.key)).map(({ key, label, icon: Icon }) => {
        const on = key === active;
        const color = on ? c.text : c.muted;
        return (
          <Pressable
            key={key}
            onPress={() => onPress(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={key === 'week' ? weekTabLabel(openToday) : label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              height: TABLET.sideItemHeight,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: on ? c.surface : 'transparent',
            }}
          >
            <Icon size={22} color={color} strokeWidth={on ? 2.25 : 1.75} />
            <AppText style={{ flex: 1, fontSize: 17, lineHeight: 21, fontWeight: '600', color }}>{label}</AppText>
            {key === 'week' && badge !== '' && (
              <Animated.View
                key={badge}
                entering={ZoomIn.duration(MOTION.badgePop).easing(EASE)}
                style={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: 11,
                  paddingHorizontal: 6,
                  backgroundColor: c.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText maxFontSizeMultiplier={1} style={[TYPE.tiny, { color: c.onAccent, fontWeight: '700' }]}>
                  {badge}
                </AppText>
              </Animated.View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
