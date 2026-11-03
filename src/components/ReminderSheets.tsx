import { BottomSheet } from '@/components/BottomSheet';
import { TimeWheel } from '@/components/TimeWheel';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { COPY } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { ReminderTime } from '@/utils/reminderSettings';
import { fromWheel, toWheel, WheelValue } from '@/utils/timeFormat';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

// The time picker sheet (frame 36). The time is kept when the sheet closes, by Done or otherwise.
// Mount it with a new key each time it opens, so it starts from the saved time.
export function TimeSheet({
  visible,
  title,
  subtitle,
  time,
  uses24,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  time: ReminderTime;
  uses24: boolean;
  onClose: (time: ReminderTime) => void;
}) {
  const c = useColors();
  const [value, setValue] = useState<WheelValue>(() => toWheel(time, uses24));
  const close = () => onClose(fromWheel(value, uses24));

  return (
    <BottomSheet visible={visible} onClose={close}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexShrink: 1 }}>
          <AppText accessibilityRole="header" style={TYPE.dayTitle}>
            {title}
          </AppText>
          <AppText style={[TYPE.subtitle, { color: c.muted, marginTop: 4 }]}>{subtitle}</AppText>
        </View>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={COPY.common.done}
          style={{ minHeight: LAYOUT.smallButtonHeight, paddingHorizontal: 10, marginTop: -6, marginRight: -10, justifyContent: 'center' }}
        >
          <AppText style={[TYPE.button, { color: c.accent }]}>{COPY.common.done}</AppText>
        </Pressable>
      </View>
      <TimeWheel value={value} uses24={uses24} onChange={(change) => setValue((v) => ({ ...v, ...change }))} />
    </BottomSheet>
  );
}

// "Allow reminders?" (frame 38), shown before Android's own question the first time a reminder goes on.
export function PermissionSheet({ visible, onContinue, onNotNow }: { visible: boolean; onContinue: () => void; onNotNow: () => void }) {
  const c = useColors();
  return (
    <BottomSheet visible={visible} onClose={onNotNow}>
      <AppText accessibilityRole="header" style={TYPE.dayTitle}>
        {COPY.permission.title}
      </AppText>
      <AppText style={{ fontSize: 16, lineHeight: 23, fontWeight: '400', color: c.muted, marginTop: 8, marginBottom: 22 }}>
        {COPY.permission.body}
      </AppText>
      <Button label={COPY.permission.continue} onPress={onContinue} />
      <Button variant="soft" label={COPY.permission.notNow} onPress={onNotNow} style={{ marginTop: 10 }} />
    </BottomSheet>
  );
}

// The box at the top of Settings while the phone blocks notifications (frame 37).
export function BlockedBox({ onOpenSettings }: { onOpenSettings: () => void }) {
  const c = useColors();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        marginHorizontal: LAYOUT.screenPadding,
        marginBottom: 12,
        backgroundColor: c.surface,
        borderRadius: LAYOUT.groupRadius,
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <AppText style={{ fontSize: 15, lineHeight: 21, fontWeight: '400' }}>{COPY.settings.blocked}</AppText>
      <Pressable
        onPress={onOpenSettings}
        accessibilityRole="button"
        accessibilityLabel={COPY.settings.openPhoneSettings}
        style={({ pressed }) => ({
          minHeight: LAYOUT.smallButtonHeight,
          marginTop: 12,
          borderRadius: LAYOUT.buttonRadius,
          backgroundColor: c.ground,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <AppText style={{ fontSize: 15, lineHeight: 20, fontWeight: '600' }}>{COPY.settings.openPhoneSettings}</AppText>
      </Pressable>
    </View>
  );
}
