import { LAYOUT } from '@/constants/layout';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { ritualDayLabel } from '@/utils/a11y';
import { ritualWeek } from '@/utils/todayModel';
import { View } from 'react-native';
import { AppText } from './ui/AppText';
import { TickCircle } from './ui/TickCircle';

interface WeekDotsProps {
  name: string;
  completedDates: string[];
  // YYYY-MM-DD of today.
  today: string;
  // Called only for today and yesterday.
  onToggleDate: (date: string) => void;
}

// "This week" on the ritual screen: one circle per day, Sunday first.
// Today and yesterday can be pressed. Older days are softer and read only. Days to come are faint dashed rings.
export function WeekDots({ name, completedDates, today, onToggleDate }: WeekDotsProps) {
  const c = useColors();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 18, paddingHorizontal: 12, paddingBottom: 6 }}>
      {ritualWeek(completedDates, today).map((day) => (
        <View
          key={day.date}
          style={{ width: LAYOUT.dayColumn, alignItems: 'center', gap: 4, opacity: day.kind === 'future' ? 0.7 : 1 }}
        >
          <AppText style={[TYPE.tiny, { color: day.isToday ? c.text : c.muted }]}>{day.letter}</AppText>
          <TickCircle
            size="week"
            checked={day.done}
            name={name}
            locked={day.kind !== 'editable'}
            dashed={day.kind === 'future'}
            faint={day.kind === 'future'}
            strongRing={day.isToday}
            spoken={ritualDayLabel(day.date, today, day.done)}
            onPress={day.kind === 'editable' ? () => onToggleDate(day.date) : undefined}
          />
        </View>
      ))}
    </View>
  );
}
