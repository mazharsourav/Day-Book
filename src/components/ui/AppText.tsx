import { MAX_FONT_SCALE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { Text, TextProps } from 'react-native';

// Text that follows the phone's text size up to 130 percent, in the text colour unless a style says otherwise.
export function AppText({ style, maxFontSizeMultiplier = MAX_FONT_SCALE, ...rest }: TextProps) {
  const c = useColors();
  return <Text {...rest} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[{ color: c.text }, style]} />;
}
