import { ColorTokens } from '@/constants/Colors';
import { LAYOUT, TABLET } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { useColors } from '@/hooks/useColors';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

// How far down the sheet must be dragged, or how fast, before it closes.
const CLOSE_DISTANCE = 80;
const CLOSE_SPEED = 800;

// The app's own bottom sheet: dimmed screen, rounded top, a small handle.
// It rises from the bottom over a fading dim (motion table, 320 ms); with Reduce Motion it fades.
// Closes on a tap outside, the Android back button, or a drag down from its top edge.
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const insets = useSafeAreaInsets();
  const tablet = useLayoutMode() !== 'phone';
  const [progress] = useState(() => new Animated.Value(0));
  const [dragY] = useState(() => new Animated.Value(0));
  const [still] = useState(() => new Animated.Value(0));
  const [height, setHeight] = useState(400);
  const [mounted, setMounted] = useState(visible);
  const [reduceMotion, setReduceMotion] = useState(false);

  // The modal stays mounted while it animates out, so mount it as soon as it is asked to show.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (visible) dragY.setValue(0);
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? MOTION.sheet : MOTION.noticeOut,
      easing: visible ? Easing.out(Easing.exp) : Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, progress, dragY]);

  // Dragging the handle area down moves the sheet with the finger; letting go far enough closes it.
  const drag = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetY(8)
    .failOffsetX([-20, 20])
    .onUpdate((e) => dragY.setValue(Math.max(0, e.translationY)))
    .onEnd((e) => {
      if (e.translationY > CLOSE_DISTANCE || e.velocityY > CLOSE_SPEED) onClose();
      else Animated.timing(dragY, { toValue: 0, duration: MOTION.moveSettle, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });

  const rise = reduceMotion ? still : progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Gestures inside a modal need their own root view on Android. */}
      <GestureHandlerRootView style={[styles.root, tablet && styles.rootCentred]}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={styles.backdropPress} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            tablet && styles.sheetCentred,
            {
              paddingBottom: tablet ? 24 : Math.max(insets.bottom, 12) + 12,
              opacity: reduceMotion ? progress : 1,
              transform: [{ translateY: Animated.add(rise, dragY) }],
            },
          ]}
        >
          <GestureDetector gesture={drag}>
            <View style={styles.handleZone}>
              <View style={[styles.handle, tablet && { opacity: 0 }]} />
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    // Tablets: sheets stay centred cards 560 wide (board chapter 10).
    rootCentred: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    sheetCentred: {
      width: TABLET.card,
      borderRadius: LAYOUT.sheetRadius,
      boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.18)',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.dim,
    },
    backdropPress: {
      flex: 1,
    },
    sheet: {
      backgroundColor: c.ground,
      borderTopLeftRadius: LAYOUT.sheetRadius,
      borderTopRightRadius: LAYOUT.sheetRadius,
      boxShadow: '0px -8px 30px rgba(0, 0, 0, 0.12)',
      paddingHorizontal: LAYOUT.screenPadding,
    },
    // A taller strip than the handle itself, so it is easy to grab. Same spacing as before:
    // 10 above the handle and 14 below it.
    handleZone: {
      paddingTop: 10,
      paddingBottom: 14,
      marginHorizontal: -LAYOUT.screenPadding,
      alignItems: 'center',
    },
    handle: {
      width: LAYOUT.handleWidth,
      height: LAYOUT.handleHeight,
      borderRadius: 3,
      backgroundColor: c.line,
    },
  });
}
