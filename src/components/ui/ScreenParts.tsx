import { LAYOUT } from '@/constants/layout';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { ChevronLeft, type LucideIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';

// The big title at the top of a tab, the grey line under it, and an optional control on the right.
export function ScreenTitle({
  title,
  subtitle,
  right,
  rowMinHeight,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  // Keeps the row the same height whether or not `right` is showing, so nothing below it jumps.
  rowMinHeight?: number;
}) {
  const c = useColors();
  return (
    <View style={{ paddingHorizontal: LAYOUT.screenPadding, paddingTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: rowMinHeight }}>
        <AppText accessibilityRole="header" style={TYPE.screenTitle}>
          {title}
        </AppText>
        {right}
      </View>
      {subtitle !== undefined && <AppText style={[TYPE.subtitle, { color: c.muted, marginTop: 4 }]}>{subtitle}</AppText>}
    </View>
  );
}

// The row at the top of a pushed screen: "< Today" or "< Settings" on the left, an optional action on the right.
export function BackRow({
  label,
  onBack,
  right,
}: {
  label: string;
  onBack: () => void;
  right?: { label: string; onPress: () => void; hint?: string };
}) {
  const c = useColors();
  return (
    <View
      style={{
        height: LAYOUT.navHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={`Back to ${label}`}
        style={{ flexDirection: 'row', alignItems: 'center', minHeight: LAYOUT.smallButtonHeight, paddingHorizontal: 10 }}
      >
        <ChevronLeft size={24} color={c.text} strokeWidth={2.25} />
        <AppText style={[TYPE.row, { fontVariant: undefined }]}>{label}</AppText>
      </Pressable>
      {right && (
        <Pressable
          onPress={right.onPress}
          accessibilityRole="button"
          accessibilityHint={right.hint}
          style={{ minHeight: LAYOUT.smallButtonHeight, paddingHorizontal: 10, justifyContent: 'center' }}
        >
          <AppText style={[TYPE.button, { color: c.accent }]}>{right.label}</AppText>
        </Pressable>
      )}
    </View>
  );
}

// A screen with nothing in it yet: what it is for, and the one thing to do next.
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; icon?: LucideIcon; onPress: () => void; variant?: 'primary' | 'soft' };
}) {
  const c = useColors();
  return (
    <View style={{ paddingHorizontal: LAYOUT.screenPadding, paddingTop: 56 }}>
      <AppText accessibilityRole="header" style={TYPE.emptyTitle}>
        {title}
      </AppText>
      <AppText style={{ fontSize: 17, lineHeight: 25, fontWeight: '500', color: c.muted, marginTop: 10, maxWidth: 300 }}>{body}</AppText>
      {action && (
        <Button
          label={action.label}
          icon={action.icon}
          variant={action.variant}
          onPress={action.onPress}
          style={{ marginTop: 28 }}
        />
      )}
    </View>
  );
}

// A short grey line under a list, for example "Only yesterday can still be changed."
export function HintLine({ children, top = 14 }: { children: string; top?: number }) {
  const c = useColors();
  return (
    <AppText style={[TYPE.small, { color: c.muted, paddingHorizontal: LAYOUT.screenPadding, paddingTop: top }]}>{children}</AppText>
  );
}
