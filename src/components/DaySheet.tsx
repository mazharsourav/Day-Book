import { BottomSheet } from '@/components/BottomSheet';
import { COPY } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { Ritual } from '@/types';
import { daySheetSubtitle, daySheetTitle } from '@/utils/historyModel';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from './ui/AppText';
import { TickCircle } from './ui/TickCircle';

interface DaySheetProps {
  visible: boolean;
  // YYYY-MM-DD of the day being looked at.
  date: string | null;
  rituals: Ritual[];
  onClose: () => void;
}

// One day from History, to look at. Nothing here can be ticked: today and yesterday are changed on Today.
export function DaySheet({ visible, date, rituals, onClose }: DaySheetProps) {
  const c = useColors();
  const done = date ? rituals.filter((r) => r.completedDates.includes(date)).length : 0;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <AppText accessibilityRole="header" style={TYPE.dayTitle}>
            {date ? daySheetTitle(date) : ''}
          </AppText>
          <AppText style={[TYPE.subtitle, { color: c.muted, marginTop: 4 }]}>{daySheetSubtitle(done, rituals.length)}</AppText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={{ minHeight: LAYOUT.smallButtonHeight, paddingHorizontal: 10, marginTop: -6, marginRight: -10, justifyContent: 'center' }}
        >
          <AppText style={[TYPE.button, { color: c.accent }]}>{COPY.common.done}</AppText>
        </Pressable>
      </View>

      <ScrollView style={{ marginTop: 6, maxHeight: 360 }} showsVerticalScrollIndicator={false}>
        {date &&
          rituals.map((ritual, i) => {
            const on = ritual.completedDates.includes(date);
            return (
              <View
                key={ritual.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: LAYOUT.rowGap, minHeight: LAYOUT.sheetRowMinHeight }}
              >
                <TickCircle checked={on} name={ritual.name} locked />
                <AppText style={[TYPE.ritualName, { flex: 1 }, on && { color: c.muted, fontWeight: '500' }]}>
                  {ritual.name}
                </AppText>
                {i < rituals.length - 1 && (
                  <View
                    style={{ position: 'absolute', left: LAYOUT.rowLineInset, right: 0, bottom: 0, height: 1, backgroundColor: c.line }}
                  />
                )}
              </View>
            );
          })}
      </ScrollView>
      <AppText style={[TYPE.small, { color: c.muted, paddingTop: 10 }]}>{COPY.history.readOnlyHint}</AppText>
    </BottomSheet>
  );
}
