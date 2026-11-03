import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { EASE, EASE_OUT } from '@/constants/easing';
import { useColors } from '@/hooks/useColors';
import { Pressable, View } from 'react-native';
import Animated, { FadeOut, SlideInUp } from 'react-native-reanimated';
import { AppText } from './AppText';

interface NoticeBarProps {
  message: string;
  action?: { label: string; onPress: () => void };
}

// A dark bar at the top of a screen. It sits in the layout, so it pushes the screen down and never covers the title.
export function NoticeBar({ message, action }: NoticeBarProps) {
  const c = useColors();
  return (
    <Animated.View
      entering={SlideInUp.duration(MOTION.noticeIn).easing(EASE)}
      exiting={FadeOut.duration(MOTION.noticeOut).easing(EASE_OUT)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ paddingHorizontal: LAYOUT.toastInset, paddingTop: 8 }}
    >
      <View
        style={{
          minHeight: LAYOUT.noticeMinHeight,
          borderRadius: LAYOUT.noticeRadius,
          backgroundColor: c.text,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 8,
          paddingLeft: 16,
          paddingRight: 8,
        }}
      >
        <AppText style={{ flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '600', color: c.ground }}>{message}</AppText>
        {action && (
          <Pressable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={{ minHeight: LAYOUT.smallButtonHeight, paddingHorizontal: 16, borderRadius: 22, backgroundColor: c.ground, justifyContent: 'center' }}
          >
            <AppText style={{ fontSize: 14, fontWeight: '700', color: c.text }}>{action.label}</AppText>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
