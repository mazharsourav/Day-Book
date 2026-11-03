import { COPY } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { MOTION, UNDO_MS, undoDuration } from '@/constants/motion';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';

interface UndoNoteProps {
  // "Task deleted" or "Moved to Thursday 5". The screen keys the note by message, so a new one restarts it.
  message: string;
  // Without it the note only tells ("Done tasks cannot be moved"): no Undo button and no line.
  onUndo?: () => void;
  // Called when the time runs out or the note is undone. The parent removes the note.
  onClose: () => void;
  // Distance from the bottom of the screen area, above the "Add task" bar.
  bottom?: number;
}

// The dark note with an Undo button. It stays 5 seconds, or longer if the phone asks for more time,
// and a thin line under it runs out to show the time left.
export function UndoNote({ message, onUndo, onClose, bottom = 78 }: UndoNoteProps) {
  const c = useColors();
  const reduceMotion = useReducedMotion();
  const [duration, setDuration] = useState<number | null>(null);
  const left = useSharedValue(1);

  useEffect(() => {
    let cancelled = false;
    // Android reads the phone's "Time to take action" setting. Elsewhere the function may be missing.
    const ask: Promise<number> =
      typeof AccessibilityInfo.getRecommendedTimeoutMillis === 'function'
        ? AccessibilityInfo.getRecommendedTimeoutMillis(UNDO_MS)
        : Promise.resolve(UNDO_MS);
    ask
      .then((ms) => !cancelled && setDuration(undoDuration(ms)))
      .catch(() => !cancelled && setDuration(UNDO_MS));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (duration === null) return;
    if (!reduceMotion && onUndo) left.value = withTiming(0, { duration, easing: Easing.linear });
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, reduceMotion, left, onClose, onUndo]);

  const line = useAnimatedStyle(() => ({ width: `${left.value * 100}%` }));

  return (
    <Animated.View
      entering={FadeInDown.duration(MOTION.deleteFold)}
      exiting={FadeOut.duration(MOTION.noticeOut)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: LAYOUT.toastInset,
        right: LAYOUT.toastInset,
        bottom,
        zIndex: 6,
        minHeight: LAYOUT.toastMinHeight,
        borderRadius: LAYOUT.toastRadius,
        backgroundColor: c.text,
        paddingLeft: 16,
        paddingRight: onUndo ? 0 : 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
      }}
    >
      <AppText style={[TYPE.subtitle, { color: c.ground, flexShrink: 1 }]}>{message}</AppText>
      {onUndo && (
      <Pressable
        onPress={() => {
          onUndo();
          onClose();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${COPY.undo.action}, ${message}`}
        style={{ minHeight: LAYOUT.toastMinHeight, paddingHorizontal: 16, justifyContent: 'center' }}
      >
        <AppText style={[TYPE.subtitle, { color: c.ground, fontWeight: '700' }]}>{COPY.undo.action}</AppText>
      </Pressable>
      )}
      {!reduceMotion && onUndo && (
        <Animated.View
          style={[{ position: 'absolute', left: 0, bottom: 0, height: 3, backgroundColor: c.ground, opacity: 0.55 }, line]}
        />
      )}
    </Animated.View>
  );
}
