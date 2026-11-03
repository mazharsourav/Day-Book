import { hitSlopFor, LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { TYPE } from '@/constants/type';
import { EASE } from '@/constants/easing';
import { useColors } from '@/hooks/useColors';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Children, isValidElement, ReactNode, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';

// A grouped list like Settings: a small grey title, rounded rows, a short note under it.

export function GroupTitle({ children }: { children: string }) {
  const c = useColors();
  return (
    <AppText accessibilityRole="header" style={[TYPE.label, { color: c.muted, paddingTop: 14, paddingHorizontal: 36, paddingBottom: 6 }]}>
      {children}
    </AppText>
  );
}

export function GroupFoot({ children }: { children: string }) {
  const c = useColors();
  return (
    <AppText style={[TYPE.small, { lineHeight: 18, color: c.muted, paddingTop: 8, paddingHorizontal: 36 }]}>{children}</AppText>
  );
}

export function Group({ children }: { children: ReactNode }) {
  const c = useColors();
  // Every row after the first gets a hairline above it.
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: LAYOUT.groupRadius, marginHorizontal: LAYOUT.screenPadding, overflow: 'hidden' }}>
      {rows.map((row, i) => (
        <View key={row.key ?? i}>
          {i > 0 && <View style={{ height: 1, marginLeft: LAYOUT.groupRowPadding, backgroundColor: c.line }} />}
          {row}
        </View>
      ))}
    </View>
  );
}

interface GroupRowProps {
  label: string;
  icon?: LucideIcon;
  // Shown in grey on the right, with a chevron (for example a time).
  value?: string;
  // A switch on the right.
  toggle?: { on: boolean; onChange: (on: boolean) => void };
  onPress?: () => void;
  // Greyed out, for example a reminder's Time while its switch is off. It can still be pressed.
  dimmed?: boolean;
  chevron?: boolean;
  disabled?: boolean;
}

export function GroupRow({ label, icon: Icon, value, toggle, onPress, dimmed = false, chevron, disabled = false }: GroupRowProps) {
  const c = useColors();
  const press = toggle ? () => toggle.onChange(!toggle.on) : onPress;
  const showChevron = chevron ?? (value !== undefined || (!!onPress && !toggle));

  return (
    <Pressable
      onPress={press}
      disabled={disabled || !press}
      accessibilityRole={toggle ? 'switch' : 'button'}
      accessibilityState={toggle ? { checked: toggle.on, disabled } : { disabled }}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => ({
        minHeight: LAYOUT.groupRowMinHeight,
        paddingHorizontal: LAYOUT.groupRowPadding,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        opacity: disabled ? 0.45 : dimmed ? 0.4 : 1,
        backgroundColor: pressed && press ? c.line : 'transparent',
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
        {Icon && <Icon size={20} color={c.muted} strokeWidth={2} />}
        <AppText style={[TYPE.row, { flexShrink: 1 }]}>{label}</AppText>
      </View>
      {toggle ? (
        <ToggleSwitch on={toggle.on} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {value !== undefined && <AppText style={[TYPE.row, { color: c.muted }]}>{value}</AppText>}
          {showChevron && <ChevronRight size={18} color={c.muted} strokeWidth={2} />}
        </View>
      )}
    </Pressable>
  );
}

// The drawn switch (51 by 31). The row around it takes the press and speaks for it.
function ToggleSwitch({ on }: { on: boolean }) {
  const c = useColors();
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    x.value = reduceMotion ? (on ? 1 : 0) : withTiming(on ? 1 : 0, { duration: MOTION.switchThumb, easing: EASE });
  }, [on, reduceMotion, x]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * (LAYOUT.switchWidth - LAYOUT.switchKnob - 4) }] }));
  // The track changes colour with the thumb (motion table: fast).
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(x.value, [0, 1], [c.ring, c.accent]) }));

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      hitSlop={hitSlopFor(LAYOUT.switchHeight)}
      style={[
        {
          width: LAYOUT.switchWidth,
          height: LAYOUT.switchHeight,
          borderRadius: LAYOUT.switchHeight / 2,
          padding: 2,
        },
        track,
      ]}
    >
      <Animated.View
        style={[
          {
            width: LAYOUT.switchKnob,
            height: LAYOUT.switchKnob,
            borderRadius: LAYOUT.switchKnob / 2,
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
          },
          knob,
        ]}
      />
    </Animated.View>
  );
}
