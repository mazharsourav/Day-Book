import { hitSlopFor, LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { useColors } from '@/hooks/useColors';
import { lockedTickLabel, tickLabel, type SpokenLabel } from '@/utils/a11y';
import { haptic } from '@/utils/haptics';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// The check mark, drawn in a 24 by 24 box. CHECK_LENGTH is the length of the stroke.
const CHECK_PATH = 'M20 6 9 17l-5-5';
const CHECK_LENGTH = 23;

interface TickCircleProps {
  checked: boolean;
  // The ritual or task name, for the screen reader.
  name: string;
  onPress?: () => void;
  // A day that can no longer be changed: the circle cannot be pressed and is drawn softer.
  locked?: boolean;
  // Tasks on a past day, and days still to come on the ritual screen.
  dashed?: boolean;
  // Today's open circle on the ritual screen has a darker ring.
  strongRing?: boolean;
  // Days still to come on the ritual screen are fainter than locked ones.
  faint?: boolean;
  // The ritual screen's week uses its own words, for example "Wednesday 4 November".
  spoken?: SpokenLabel;
  size?: 'regular' | 'small' | 'week';
  // Extra screen-reader actions, for example a task's Edit, Move to another day and Delete.
  actions?: { name: string; label: string }[];
  onAction?: (name: string) => void;
}

const DIAMETER = { regular: LAYOUT.tick, small: LAYOUT.tickSmall, week: LAYOUT.weekTick } as const;

// The one coloured circle. Open: a ring. Done: filled pine with a check mark that draws itself.
// Locked: the same drawing, softer.
export function TickCircle({
  checked,
  name,
  onPress,
  locked = false,
  dashed = false,
  strongRing = false,
  faint = false,
  spoken: spokenOverride,
  size = 'regular',
  actions,
  onAction,
}: TickCircleProps) {
  const c = useColors();
  const reduceMotion = useReducedMotion();
  const d = DIAMETER[size];
  const border = size === 'small' ? 1.5 : LAYOUT.tickBorder;
  const fill = useSharedValue(checked ? 1 : 0);
  const draw = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    const to = checked ? 1 : 0;
    if (reduceMotion) {
      fill.value = to;
      draw.value = to;
      return;
    }
    fill.value = withTiming(to, { duration: checked ? MOTION.tickFill : MOTION.untick, easing: Easing.out(Easing.cubic) });
    // The mark draws on the way in; on the way out it simply goes with the fill.
    draw.value = checked
      ? withTiming(1, { duration: MOTION.tickCheck, easing: Easing.out(Easing.cubic) })
      : withTiming(0, { duration: MOTION.untick });
  }, [checked, reduceMotion, fill, draw]);

  const fillStyle = useAnimatedStyle(() => ({ opacity: fill.value }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LENGTH * (1 - draw.value) }));

  const spoken =
    spokenOverride ?? (locked ? { label: lockedTickLabel(name, checked), hint: undefined } : tickLabel(name, checked));
  const box = size === 'week' ? LAYOUT.weekTick : LAYOUT.smallButtonHeight;
  const checkSize = Math.min(18, d * 0.6);

  const handlePress = () => {
    if (!onPress) return;
    // A light tap when ticking; unticking is quiet.
    if (!checked) haptic.tick();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={locked || !onPress}
      hitSlop={hitSlopFor(box)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: locked || !onPress }}
      accessibilityLabel={spoken.label}
      accessibilityHint={spoken.hint}
      accessibilityActions={actions}
      onAccessibilityAction={onAction ? (e) => onAction(e.nativeEvent.actionName) : undefined}
      style={{
        width: box,
        height: box,
        marginLeft: size === 'week' ? 0 : -7,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <View
        style={{
          width: d,
          height: d,
          borderRadius: d / 2,
          borderWidth: border,
          borderStyle: dashed && !checked ? 'dashed' : 'solid',
          borderColor: checked ? c.accent : strongRing ? c.text : c.ring,
          opacity: faint ? 0.4 : locked ? 0.55 : 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Covers the ring's edge too, so a done circle is one even pine disc with no lighter rim. */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -border,
              left: -border,
              width: d,
              height: d,
              borderRadius: d / 2,
              backgroundColor: c.accent,
            },
            fillStyle,
          ]}
        />
        {/* Positioned like the fill, and after it, so the mark is always drawn on top. */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={checkSize} height={checkSize} viewBox="0 0 24 24">
            <AnimatedPath
              d={CHECK_PATH}
              stroke={c.onAccent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={CHECK_LENGTH}
              animatedProps={checkProps}
            />
          </Svg>
        </View>
      </View>
    </Pressable>
  );
}
