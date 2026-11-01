import { ColorTokens } from "@/constants/Colors";
import { useColors } from "@/hooks/useColors";
import { Ritual } from "@/types";
import { fromDateString, weekDatesFor } from "@/utils/dates";
import { Check } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface WeekDotsProps {
  ritual: Ritual;
  // YYYY-MM-DD of today.
  today: string;
  // Tapping a day that is not in the future toggles it.
  onToggleDate: (date: string) => void;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function WeekDots({ ritual, today, onToggleDate }: WeekDotsProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const weekDates = weekDatesFor(today);
  const completedSet = new Set(ritual.completedDates);

  return (
    <View style={styles.container}>
      {weekDates.map((date, index) => {
        const completed = completedSet.has(date);
        const isToday = date === today;
        const isFuture = date > today;
        const dayName = fromDateString(date).toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
        });
        const state = isFuture ? "upcoming" : completed ? "taken" : "not taken";

        return (
          <Pressable
            key={date}
            style={styles.dayWrap}
            disabled={isFuture}
            onPress={() => onToggleDate(date)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: completed, disabled: isFuture }}
            accessibilityLabel={`${dayName}, ${state}`}
            accessibilityHint={isFuture ? undefined : "Double tap to change"}
          >
            <View
              style={[
                styles.dot,
                isFuture && styles.dotFuture,
                completed && styles.dotDone,
                isToday && styles.dotToday,
              ]}
            >
              {completed && <Check size={16} color={c.onDone} strokeWidth={3} />}
            </View>
            <Text style={[styles.label, isToday && styles.labelToday]}>{DAY_LABELS[index]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dayWrap: {
      flex: 1,
      alignItems: "center",
      gap: 6,
      minHeight: 48,
    },
    dot: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.well,
      alignItems: "center",
      justifyContent: "center",
    },
    dotFuture: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: c.hairline,
    },
    dotDone: {
      backgroundColor: c.done,
      borderWidth: 0,
    },
    dotToday: {
      boxShadow: `0px 0px 0px 2px ${c.ground}, 0px 0px 0px 4px ${c.ink}`,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: c.inkMuted,
    },
    labelToday: {
      color: c.ink,
    },
  });
}
