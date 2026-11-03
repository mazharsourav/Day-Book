import { LAYOUT } from '@/constants/layout';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { AppText } from './AppText';

interface ButtonProps {
  label: string;
  onPress: () => void;
  // primary: pine with white text. soft: grey with ink, also used for "Done for today".
  variant?: 'primary' | 'soft';
  icon?: LucideIcon;
  // The board draws each button's icon at its own size: plus 20 by 2.5, check 20 by 3, trash 18 by 2.
  iconSize?: number;
  iconStrokeWidth?: number;
  disabled?: boolean;
  // Smaller, for boxes inside a screen (for example "Open phone settings").
  compact?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  iconSize = 20,
  iconStrokeWidth,
  disabled = false,
  compact = false,
  accessibilityHint,
  style,
}: ButtonProps) {
  const c = useColors();
  const bg = variant === 'primary' ? c.accent : c.surface;
  const fg = variant === 'primary' ? c.onAccent : c.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          height: compact ? LAYOUT.smallButtonHeight : LAYOUT.buttonHeight,
          borderRadius: LAYOUT.buttonRadius,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {Icon && <Icon size={iconSize} color={fg} strokeWidth={iconStrokeWidth ?? (variant === 'primary' ? 2.5 : 3)} />}
      <AppText style={[TYPE.button, compact && { fontSize: 15 }, { color: fg }]}>{label}</AppText>
    </Pressable>
  );
}
