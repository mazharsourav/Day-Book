import { DoseCell } from '@/components/DoseCell';
import { ColorTokens } from '@/constants/Colors';
import { getRitualIcon } from '@/constants/ritualIcons';
import { useColors } from '@/hooks/useColors';
import { Ritual } from '@/types';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface RitualRowProps {
  ritual: Ritual;
  isCompletedToday: boolean;
  streak: number;
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
}

export function RitualRow({
  ritual,
  isCompletedToday,
  streak,
  onToggle,
  onPress,
}: RitualRowProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const meta = streak > 0 ? `${streak} day streak` : 'Start a streak today';
  const { Icon } = getRitualIcon(ritual.icon);

  return (
    <View style={styles.row}>
      <DoseCell
        done={isCompletedToday}
        onPress={() => onToggle(ritual.id)}
        open={<Icon size={22} color={c.inkMuted} strokeWidth={2} />}
        accessibilityLabel={ritual.name}
      />
      <Pressable
        style={styles.main}
        onPress={() => onPress(ritual.id)}
        accessibilityRole="button"
        accessibilityLabel={`${ritual.name}, ${meta}`}
        accessibilityHint="Opens ritual details"
      >
        <Text style={[styles.name, isCompletedToday && styles.nameDone]}>{ritual.name}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </Pressable>
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: 68,
      borderBottomWidth: 1,
      borderBottomColor: c.hairline,
    },
    main: {
      flex: 1,
      paddingVertical: 10,
      minHeight: 44,
      justifyContent: 'center',
    },
    name: {
      fontSize: 17,
      fontWeight: '600',
      color: c.ink,
    },
    nameDone: {
      color: c.inkMuted,
      fontWeight: '500',
    },
    meta: {
      fontSize: 13,
      color: c.inkMuted,
    },
  });
}
