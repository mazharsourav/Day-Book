import { BottomSheet } from '@/components/BottomSheet';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { Trash, type LucideIcon } from 'lucide-react-native';
import { AppText } from './ui/AppText';
import { Button } from './ui/Button';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  // The safe choice, shown first and strongest.
  cancelLabel: string;
  // The other choice, shown second with an icon.
  confirmLabel: string;
  confirmIcon?: LucideIcon;
  onCancel: () => void;
  onConfirm: () => void;
}

// A question in the app's own look, used instead of the system pop-up. The safe answer is the pine button.
export function ConfirmSheet({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  confirmIcon = Trash,
  onCancel,
  onConfirm,
}: ConfirmSheetProps) {
  const c = useColors();

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <AppText accessibilityRole="header" style={TYPE.dayTitle}>
        {title}
      </AppText>
      <AppText style={{ fontSize: 16, lineHeight: 23, fontWeight: '400', color: c.muted, marginTop: 8, marginBottom: 22 }}>
        {message}
      </AppText>
      <Button label={cancelLabel} onPress={onCancel} />
      <Button
        variant="soft"
        label={confirmLabel}
        icon={confirmIcon}
        iconSize={18}
        iconStrokeWidth={2}
        onPress={onConfirm}
        style={{ marginTop: 10 }}
      />
    </BottomSheet>
  );
}
