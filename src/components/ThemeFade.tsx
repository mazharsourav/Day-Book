import { darkColors, lightColors } from '@/constants/Colors';
import { MOTION } from '@/constants/motion';
import { useColors } from '@/hooks/useColors';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

// Light and Dark: the whole screen cross-fades, nothing flashes (motion table: 220 ms).
// When the mode changes, a cover in the old background colour sits over everything for one frame,
// then fades away to show the screen in the new colours.
export function ThemeFade() {
  const { scheme } = useColors();
  const [last, setLast] = useState(scheme);
  const [cover, setCover] = useState<{ color: string; key: number } | null>(null);
  if (last !== scheme) {
    setLast(scheme);
    setCover({ color: (last === 'dark' ? darkColors : lightColors).ground, key: (cover?.key ?? 0) + 1 });
  }

  // Removing the cover starts its fade.
  useEffect(() => {
    if (!cover) return;
    const id = requestAnimationFrame(() => setCover(null));
    return () => cancelAnimationFrame(id);
  }, [cover]);

  if (!cover) return null;
  return (
    <Animated.View
      key={cover.key}
      pointerEvents="none"
      exiting={FadeOut.duration(MOTION.themeFade)}
      style={[StyleSheet.absoluteFill, { backgroundColor: cover.color }]}
    />
  );
}
