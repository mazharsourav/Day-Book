import { BottomSheet } from '@/components/BottomSheet';
import { ColorTokens } from '@/constants/Colors';
import { useColors } from '@/hooks/useColors';
import { Trash } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  // The safe choice, shown first and strongest.
  cancelLabel: string;
  // The destructive choice, shown second with a trash icon.
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// Confirmation in the app's own look, used instead of the system pop-up.
export function ConfirmSheet({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmSheetProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>

      <Pressable
        style={styles.keep}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
      >
        <Text style={styles.keepText}>{cancelLabel}</Text>
      </Pressable>

      <Pressable
        style={styles.remove}
        onPress={onConfirm}
        accessibilityRole="button"
        accessibilityLabel={confirmLabel}
      >
        <Trash size={18} color={c.ink} strokeWidth={2} />
        <Text style={styles.removeText}>{confirmLabel}</Text>
      </Pressable>
    </BottomSheet>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: c.ink,
      letterSpacing: -0.3,
    },
    message: {
      fontSize: 15,
      lineHeight: 21,
      color: c.inkMuted,
      marginTop: 6,
      marginBottom: 22,
    },
    keep: {
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: c.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keepText: {
      fontSize: 17,
      fontWeight: '700',
      color: c.ground,
    },
    remove: {
      flexDirection: 'row',
      gap: 8,
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: c.well,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    removeText: {
      fontSize: 16,
      fontWeight: '700',
      color: c.ink,
    },
  });
}
