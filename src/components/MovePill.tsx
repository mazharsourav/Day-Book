import { COPY, moveToLine } from '@/constants/copy';
import { useColors } from '@/hooks/useColors';
import type { DropMeaning } from '@/utils/dragMove';
import { Lock } from 'lucide-react-native';
import { View } from 'react-native';
import { AppText } from './ui/AppText';

// The pill while a task is carried: "Move to Thursday 12", "Hold for next week", or the grey
// "Past day, read only". At the right of the day heading on a phone, beside the week arrows on a tablet.
export function MovePill({ meaning }: { meaning: NonNullable<DropMeaning> }) {
  const c = useColors();
  const refuse = meaning.kind === 'refuse';
  const label =
    meaning.kind === 'move'
      ? moveToLine(meaning.date)
      : meaning.kind === 'arrow'
        ? meaning.weeks === 1
          ? COPY.week.holdForNextWeek
          : COPY.week.holdForPreviousWeek
        : COPY.week.pastDayPill;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 3,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: refuse ? c.surface : c.accent,
      }}
    >
      {refuse && <Lock size={12} color={c.text} strokeWidth={2.5} />}
      <AppText numberOfLines={1} style={{ fontSize: 13, lineHeight: 17, fontWeight: '600', color: refuse ? c.text : c.onAccent }}>
        {label}
      </AppText>
    </View>
  );
}
