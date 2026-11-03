import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { useColors } from '@/hooks/useColors';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, SlideInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';

export interface NavAction {
  label: string;
  onPress: () => void;
  accent?: boolean;
  disabled?: boolean;
  hint?: string;
}

interface ModalCardProps {
  title: string;
  left: NavAction;
  right?: NavAction;
  children: ReactNode;
}

// A form or tool over the dimmed screen: a card from just under the status bar, rounded at the top,
// with Cancel or Close on the left, the title in the middle and the main action on the right.
// Used by routes presented as transparent modals, so the screen behind stays visible.
// Dragging the top bar down closes it, the same as Cancel or Close (motion table: "Drag down to close").
export function ModalCard({ title, left, right, children }: ModalCardProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const dragY = useSharedValue(0);
  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragY.value }] }));

  const drag = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetY(8)
    .failOffsetX([-20, 20])
    .onUpdate((e) => dragY.set(Math.max(0, e.translationY)))
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 800) left.onPress();
      else dragY.set(withTiming(0, { duration: MOTION.moveSettle, easing: Easing.out(Easing.cubic) }));
    });

  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.dim }} />
      <Animated.View
        // Rises from the bottom; with Reduce Motion it fades in instead.
        entering={reduceMotion ? FadeIn.duration(MOTION.sheet) : SlideInDown.duration(MOTION.sheet)}
        accessibilityViewIsModal
        style={{
          position: 'absolute',
          top: Math.max(insets.top - 4, 12),
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: c.ground,
          borderTopLeftRadius: LAYOUT.modalRadius,
          borderTopRightRadius: LAYOUT.modalRadius,
          overflow: 'hidden',
        }}
      >
        <Animated.View style={[{ flex: 1 }, dragStyle]}>
        <GestureDetector gesture={drag}>
        <View
          style={{
            height: 56,
            paddingTop: 6,
            paddingHorizontal: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <NavText {...left} />
          <AppText accessibilityRole="header" style={{ fontSize: 17, lineHeight: 21, fontWeight: '700' }}>
            {title}
          </AppText>
          {right ? (
            <NavText {...right} />
          ) : (
            // Keeps the title centred.
            <View style={{ opacity: 0 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <NavText {...left} />
            </View>
          )}
        </View>
        </GestureDetector>
        {/* Shrinks the card's content above the keyboard, so a field being typed in is never hidden. */}
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {children}
        </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function NavText({ label, onPress, accent = false, disabled = false, hint }: NavAction) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={hint}
      style={{ minHeight: LAYOUT.smallButtonHeight, minWidth: LAYOUT.smallButtonHeight, paddingHorizontal: 10, justifyContent: 'center' }}
    >
      <AppText
        style={{
          fontSize: 17,
          lineHeight: 21,
          fontWeight: accent && !disabled ? '600' : '500',
          color: accent && !disabled ? c.accent : disabled ? c.muted : c.text,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
