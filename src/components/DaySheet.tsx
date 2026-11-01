import { BottomSheet } from '@/components/BottomSheet';
import { DoseCell } from '@/components/DoseCell';
import { ColorTokens } from '@/constants/Colors';
import { getRitualIcon } from '@/constants/ritualIcons';
import { useColors } from '@/hooks/useColors';
import { Ritual } from '@/types';
import { fromDateString } from '@/utils/dates';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface DaySheetProps {
  visible: boolean;
  // YYYY-MM-DD of the day being looked at.
  date: string | null;
  rituals: Ritual[];
  onToggle: (id: string, date: string) => void;
  onClose: () => void;
}

// Shows one day's rituals so a missed or mistaken tick can be fixed after the fact.
export function DaySheet({ visible, date, rituals, onToggle, onClose }: DaySheetProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const title = date
    ? fromDateString(date).toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '';
  const takenCount = date ? rituals.filter((r) => r.completedDates.includes(date)).length : 0;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.summary}>
        {takenCount} of {rituals.length} taken
      </Text>

      {rituals.length === 0 ? (
        <Text style={styles.empty}>No rituals yet.</Text>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {date &&
            rituals.map((ritual) => {
              const { Icon } = getRitualIcon(ritual.icon);
              const taken = ritual.completedDates.includes(date);
              return (
                <View key={ritual.id} style={styles.row}>
                  <DoseCell
                    done={taken}
                    onPress={() => onToggle(ritual.id, date)}
                    open={<Icon size={22} color={c.inkMuted} strokeWidth={2} />}
                    accessibilityLabel={`${ritual.name}, ${taken ? 'taken' : 'not taken'}`}
                    accessibilityHint="Double tap to change"
                  />
                  <Text style={[styles.name, taken && styles.nameTaken]}>{ritual.name}</Text>
                </View>
              );
            })}
        </ScrollView>
      )}

      <Pressable
        style={styles.done}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Done"
      >
        <Text style={styles.doneText}>Done</Text>
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
    summary: {
      fontSize: 14,
      color: c.inkMuted,
      marginTop: 4,
      marginBottom: 8,
      fontVariant: ['tabular-nums'],
    },
    empty: {
      fontSize: 15,
      color: c.inkMuted,
      paddingVertical: 24,
    },
    list: {
      maxHeight: 340,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: 60,
    },
    name: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: c.ink,
    },
    nameTaken: {
      color: c.inkMuted,
      fontWeight: '500',
    },
    done: {
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: c.ink,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    doneText: {
      fontSize: 17,
      fontWeight: '700',
      color: c.ground,
    },
  });
}
