import { progressLeft, progressText } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { progressLabel } from '@/utils/a11y';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';

interface ProgressBarProps {
  done: number;
  total: number;
  // "2 left" shows only on today.
  isToday: boolean;
}

// "3 of 5 done" on the left, "2 left" on the right, and a slim pine bar under them.
export function ProgressBar({ done, total, isToday }: ProgressBarProps) {
  const c = useColors();
  const reduceMotion = useReducedMotion();
  const share = total > 0 ? done / total : 0;
  const width = useSharedValue(share);

  useEffect(() => {
    width.value = reduceMotion
      ? share
      : withTiming(share, { duration: MOTION.tickBar, easing: Easing.out(Easing.cubic) });
  }, [share, reduceMotion, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  const right = progressLeft(done, total, isToday);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={progressLabel(done, total, isToday)}
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={{ paddingHorizontal: LAYOUT.screenPadding, paddingTop: 12, paddingBottom: 6 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AppText style={TYPE.progress}>{progressText(done, total)}</AppText>
        {right !== '' && <AppText style={[TYPE.small, { color: c.muted }]}>{right}</AppText>}
      </View>
      <View
        style={{
          height: LAYOUT.barHeight,
          borderRadius: LAYOUT.barHeight / 2,
          backgroundColor: c.line,
          marginTop: 8,
          overflow: 'hidden',
        }}
      >
        <Animated.View style={[{ height: '100%', borderRadius: LAYOUT.barHeight / 2, backgroundColor: c.accent }, fillStyle]} />
      </View>
    </View>
  );
}
