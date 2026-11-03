import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { ReactNode } from 'react';
import { AppText } from './AppText';

// The small grey label above a form field ("Name", "Title", "Day").
export function FieldLabel({
  children,
  first = false,
  onLayout,
}: {
  children: ReactNode;
  first?: boolean;
  // Reports where the label sits in the form, so the form can scroll to it.
  onLayout?: (y: number) => void;
}) {
  const c = useColors();
  return (
    <AppText
      onLayout={onLayout ? (e) => onLayout(e.nativeEvent.layout.y) : undefined}
      style={[TYPE.label, { color: c.muted, marginTop: first ? 8 : 22, marginBottom: 8, marginLeft: 2 }]}
    >
      {children}
    </AppText>
  );
}
