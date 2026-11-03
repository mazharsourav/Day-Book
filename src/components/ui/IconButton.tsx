import { LAYOUT } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  // A task is held over it: it turns green and flips the week after a moment (frame 21).
  hot?: boolean;
}

// A round grey button with one icon: month and week arrows, the share button.
export function IconButton({ icon: Icon, label, onPress, disabled = false, hot = false }: IconButtonProps) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={2}
      style={({ pressed }) => ({
        width: LAYOUT.smallButtonHeight,
        height: LAYOUT.smallButtonHeight,
        borderRadius: LAYOUT.smallButtonHeight / 2,
        backgroundColor: hot ? c.tint : c.surface,
        borderWidth: hot ? 2 : 0,
        borderColor: c.accent,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      <Icon size={22} color={hot ? c.accent : c.text} strokeWidth={2} />
    </Pressable>
  );
}
