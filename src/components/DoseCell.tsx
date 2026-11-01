import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

interface DoseCellProps {
  done: boolean;
  onPress: () => void;
  // What the cell shows while it is open: a number or an icon.
  open: ReactNode;
  // Fill of the open cell. Defaults to the screen ground.
  openFill?: string;
  size?: number;
  // Play one ring leaving the cell when it is taken (detail screen).
  ripple?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

// The recurring object of the app: a round cell that is pressed in when open and green when taken.
export function DoseCell({
  done,
  onPress,
  open,
  openFill,
  size = 44,
  ripple = false,
  accessibilityLabel,
  accessibilityHint,
}: DoseCellProps) {
  const c = useColors();
  const [fill] = useState(() => new Animated.Value(done ? 1 : 0));
  const [press] = useState(() => new Animated.Value(1));
  const [ring] = useState(() => new Animated.Value(0));
  const wasDone = useRef(done);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      fill.setValue(done ? 1 : 0);
    } else {
      Animated.timing(fill, {
        toValue: done ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }).start();
    }
    if (ripple && done && !wasDone.current && !reduceMotion) {
      ring.setValue(0);
      Animated.timing(ring, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    }
    wasDone.current = done;
  }, [done, ripple, reduceMotion, fill, ring]);

  const styles = useMemo(() => createStyles(size), [size]);
  const large = size >= 100;
  const pressedShadow = large
    ? `inset 0px 3px 5px ${c.inset}`
    : `inset 0px 2px 3px ${c.inset}`;
  const filledShadow = '0px 1px 1px rgba(0, 0, 0, 0.18)';

  const handlePress = () => {
    if (done) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onPress();
  };

  const pressTo = (value: number, duration: number) => {
    if (reduceMotion) return;
    Animated.timing(press, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => pressTo(large ? 0.96 : 0.94, 90)}
      onPressOut={() => pressTo(1, 140)}
      style={styles.hit}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Animated.View style={[styles.box, { transform: [{ scale: press }] }]}>
        {ripple && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                borderColor: c.done,
                opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                transform: [
                  { scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] }) },
                ],
              },
            ]}
          />
        )}
        <Animated.View
          style={[
            styles.cell,
            {
              backgroundColor: fill.interpolate({
                inputRange: [0, 1],
                outputRange: [openFill ?? c.ground, c.done],
              }),
              boxShadow: done ? filledShadow : pressedShadow,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.face,
              { opacity: fill.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
            ]}
          >
            {open}
          </Animated.View>
          <Animated.View style={[styles.face, { opacity: fill }]}>
            <View>
              <Check size={Math.round(size * 0.5)} color={c.onDone} strokeWidth={2.75} />
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function createStyles(size: number) {
  return StyleSheet.create({
    hit: {
      width: size,
      height: size,
    },
    box: {
      width: size,
      height: size,
    },
    ring: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: size / 2,
      borderWidth: 3,
    },
    cell: {
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    face: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
