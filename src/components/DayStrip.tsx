import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { TYPE } from '@/constants/type';
import { EASE } from '@/constants/easing';
import { useColors } from '@/hooks/useColors';
import type { StripDay } from '@/utils/todayModel';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './ui/AppText';

interface DayStripProps {
  days: StripDay[];
  onSelect: (date: string) => void;
  // What the screen reader says for each day.
  labelFor: (day: StripDay) => string;
  // While a task is carried: the day under the finger lights up, or shows a grey ring when it refuses (a past day).
  highlight?: { date: string; kind: 'drop' | 'refuse' } | null;
}

// The strip's side padding. Moving a task shares the width inside it among the seven days.
export const STRIP_SIDE_PAD = 12;
const PAD_TOP = 18;
const CIRCLE_INSET = (LAYOUT.dayColumn - LAYOUT.dayCircle) / 2;

// A week of days, Sunday first: the letter, the date in a circle, and a small dot for how much was done.
// The chosen day is a dark circle that glides to a newly chosen day (motion table: medium), and each
// number turns light as the circle passes under it. Disabled days (days to come on Today, past days
// in the task form) are faint and cannot be chosen.
export function DayStrip({ days, onSelect, labelFor, highlight }: DayStripProps) {
  const c = useColors();
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [circleTop, setCircleTop] = useState(0);
  const chosen = days.findIndex((d) => d.selected);

  // Where each day's circle sits. The columns are spread out evenly, edge to edge inside the padding.
  const step = width > 0 ? (width - 2 * STRIP_SIDE_PAD - LAYOUT.dayColumn) / 6 : 0;
  const leftOf = (i: number) => STRIP_SIDE_PAD + i * step + CIRCLE_INSET;

  // One dark circle for the whole strip. It is always drawn, in one colour, and only moved and faded,
  // so Android keeps its round shape (some phones drew a square when a colour was switched on).
  const x = useSharedValue(0);
  const shown = useSharedValue(0);
  const placed = useRef(false);
  // null until the strip is measured, or when the chosen day is not in this week.
  const target = width > 0 && chosen >= 0 ? leftOf(chosen) : null;
  useEffect(() => {
    if (target === null) {
      shown.value = 0;
      return;
    }
    // The first time, after a week without the chosen day, or with Reduce Motion, it simply appears.
    const glide = placed.current && !reduceMotion && shown.value === 1;
    x.value = glide ? withTiming(target, { duration: MOTION.dayPick, easing: EASE }) : target;
    shown.value = 1;
    placed.current = true;
  }, [target, reduceMotion, x, shown]);

  const circleStyle = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: PAD_TOP, paddingHorizontal: STRIP_SIDE_PAD, paddingBottom: 6 }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            top: PAD_TOP + circleTop,
            width: LAYOUT.dayCircle,
            height: LAYOUT.dayCircle,
            borderRadius: LAYOUT.dayCircle / 2,
            backgroundColor: c.text,
          },
          circleStyle,
        ]}
      />
      {days.map((day, i) => {
        const { selected, isToday, disabled, dot } = day;
        const lit = highlight?.date === day.date ? highlight.kind : null;
        return (
          <Pressable
            key={day.date}
            onPress={() => onSelect(day.date)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={labelFor(day)}
            style={{ width: LAYOUT.dayColumn, alignItems: 'center', gap: 4, opacity: disabled ? 0.7 : 1 }}
          >
            <AppText style={[TYPE.tiny, { color: isToday && !selected ? c.text : c.muted }]}>{day.letter}</AppText>
            <View
              onLayout={i === 0 ? (e) => setCircleTop(e.nativeEvent.layout.y) : undefined}
              style={{ width: LAYOUT.dayCircle, height: LAYOUT.dayCircle, alignItems: 'center', justifyContent: 'center' }}
            >
              {lit && !selected && (
                // The day under the finger lights up (motion table: fast).
                <Animated.View
                  key={lit}
                  entering={FadeIn.duration(MOTION.moveLight).easing(EASE)}
                  style={{
                    position: 'absolute',
                    width: LAYOUT.dayCircle,
                    height: LAYOUT.dayCircle,
                    borderRadius: LAYOUT.dayCircle / 2,
                    backgroundColor: lit === 'drop' ? c.tint : 'transparent',
                    borderWidth: 2,
                    borderColor: lit === 'drop' ? c.accent : c.ring,
                  }}
                />
              )}
              <DayNumber
                number={day.number}
                left={leftOf(i)}
                x={x}
                shown={shown}
                base={disabled ? c.muted : c.text}
                light={c.ground}
                weight={isToday ? '700' : disabled ? '500' : '600'}
              />
            </View>
            <View
              style={{
                width: LAYOUT.dayDot,
                height: LAYOUT.dayDot,
                borderRadius: LAYOUT.dayDot / 2,
                borderWidth: 1.5,
                borderColor: dot === 'none' ? 'transparent' : c.accent,
                backgroundColor: dot === 'all' ? c.accent : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

// A day's number. It turns light as far as the dark circle covers it, so it stays readable
// while the circle glides past.
function DayNumber({
  number,
  left,
  x,
  shown,
  base,
  light,
  weight,
}: {
  number: number;
  left: number;
  x: SharedValue<number>;
  shown: SharedValue<number>;
  base: string;
  light: string;
  weight: '500' | '600' | '700';
}) {
  const style = useAnimatedStyle(() => {
    const cover = Math.max(0, 1 - Math.abs(x.value - left) / LAYOUT.dayCircle) * shown.value;
    return { color: interpolateColor(cover, [0, 1], [base, light]) };
  });
  return (
    <Animated.Text
      maxFontSizeMultiplier={1.15}
      style={[{ fontSize: 16, fontWeight: weight, fontVariant: ['tabular-nums'] }, style]}
    >
      {number}
    </Animated.Text>
  );
}
