import { streakLine } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { getRitualIcon } from '@/constants/ritualIcons';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { Ritual } from '@/types';
import { ritualNameLabel } from '@/utils/a11y';
import { Pressable, View } from 'react-native';
import { AppText } from './ui/AppText';
import { TickCircle } from './ui/TickCircle';

interface RitualRowProps {
  ritual: Ritual;
  // Done on the day being shown.
  done: boolean;
  streak: number;
  // An older day: the circle is a record and cannot be pressed.
  locked: boolean;
  // No line under the last row.
  last: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}

// One ritual on Today: the circle, the name with its streak, and the ritual's icon at the right.
// The order never changes when something is ticked; a done name just turns quiet grey.
export function RitualRow({ ritual, done, streak, locked, last, onToggle, onOpen }: RitualRowProps) {
  const c = useColors();
  const { Icon } = getRitualIcon(ritual.icon);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: LAYOUT.rowGap, minHeight: LAYOUT.rowMinHeight }}>
      <TickCircle checked={done} name={ritual.name} locked={locked} onPress={() => onToggle(ritual.id)} />
      <Pressable
        onPress={() => onOpen(ritual.id)}
        accessibilityRole="button"
        accessibilityLabel={ritualNameLabel(ritual.name, streak)}
        style={{ flex: 1, minWidth: 0, minHeight: LAYOUT.smallButtonHeight, paddingVertical: 10, justifyContent: 'center' }}
      >
        <AppText style={[TYPE.ritualName, done && { color: c.muted, fontWeight: '500' }]}>{ritual.name}</AppText>
        <AppText style={[TYPE.small, { color: c.muted, marginTop: 1 }]}>{streakLine(streak)}</AppText>
      </Pressable>
      <View style={{ opacity: 0.85 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Icon size={20} color={c.muted} strokeWidth={1.75} />
      </View>
      {!last && (
        <View
          style={{ position: 'absolute', left: LAYOUT.rowLineInset, right: 0, bottom: 0, height: 1, backgroundColor: c.line }}
        />
      )}
    </View>
  );
}
