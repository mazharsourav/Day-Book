import { DaySheet } from "@/components/DaySheet";
import { ColorTokens, mix } from "@/constants/Colors";
import { getRitualIcon } from "@/constants/ritualIcons";
import { useRituals } from "@/context/RitualContext";
import { useColors } from "@/hooks/useColors";
import { useToday } from "@/hooks/useToday";
import {
  earliestMonth,
  getCalendarDays,
  MONTH_NAMES,
  MonthView,
  monthIndex,
  monthPrefix,
  shiftMonth,
} from "@/utils/calendar";
import { fromDateString, toDateString } from "@/utils/dates";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Share } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function HistoryScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { rituals, toggleCompleted } = useRituals();
  const today = useToday();

  const todayDate = fromDateString(today);
  const current: MonthView = { year: todayDate.getFullYear(), month: todayDate.getMonth() };

  // null means "follow the current month", so the view moves on by itself at month end.
  const [picked, setPicked] = useState<MonthView | null>(null);
  const view = picked ?? current;
  const isCurrentMonth = monthIndex(view) === monthIndex(current);

  const earliest = earliestMonth(
    rituals.flatMap((r) => [...r.completedDates, r.createdAt.slice(0, 10)]),
    current
  );
  const canGoBack = monthIndex(view) > monthIndex(earliest);
  const canGoForward = monthIndex(view) < monthIndex(current);

  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const calendarDays = getCalendarDays(view.year, view.month);
  const prefix = monthPrefix(view);
  const someTint = mix(c.done, c.ground, 0.34);

  const doses = rituals.reduce(
    (sum, r) => sum + r.completedDates.filter((d) => d.startsWith(prefix)).length,
    0
  );

  const goTo = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = shiftMonth(view, delta);
    setPicked(monthIndex(next) === monthIndex(current) ? null : next);
  };

  const openDay = (dateStr: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSheetDate(dateStr);
    setSheetOpen(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            History
          </Text>
          {rituals.length > 0 && (
            <Pressable
              style={styles.shareButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/share-month",
                  params: { year: String(view.year), month: String(view.month) },
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Share ${MONTH_NAMES[view.month]} ${view.year}`}
            >
              <Share size={22} color={c.ink} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        <View style={styles.monthRow}>
          <Pressable
            style={[styles.arrow, !canGoBack && styles.arrowOff]}
            disabled={!canGoBack}
            onPress={() => goTo(-1)}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            accessibilityState={{ disabled: !canGoBack }}
          >
            <ChevronLeft size={22} color={c.ink} strokeWidth={2} />
          </Pressable>

          <View style={styles.monthText}>
            <Text style={styles.month} accessibilityRole="header">
              {MONTH_NAMES[view.month]} {view.year}
            </Text>
            <Text style={styles.monthMeta}>
              {doses} {doses === 1 ? "dose" : "doses"} taken
            </Text>
          </View>

          <Pressable
            style={[styles.arrow, !canGoForward && styles.arrowOff]}
            disabled={!canGoForward}
            onPress={() => goTo(1)}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            accessibilityState={{ disabled: !canGoForward }}
          >
            <ChevronRight size={22} color={c.ink} strokeWidth={2} />
          </Pressable>
        </View>

        <View
          style={styles.dow}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {DAY_LABELS.map((label, i) => (
            <Text key={`${label}-${i}`} style={styles.dowLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <View
                  key={`empty-${index}`}
                  style={styles.slot}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              );
            }
            const dateStr = toDateString(new Date(view.year, view.month, day));
            const isFuture = dateStr > today;
            const isToday = dateStr === today;
            const count = isFuture
              ? 0
              : rituals.filter((r) => r.completedDates.includes(dateStr)).length;
            const all = rituals.length > 0 && count === rituals.length;
            const some = count > 0 && !all;

            const label = `${MONTH_NAMES[view.month]} ${day}${
              isFuture ? "" : `, ${count} of ${rituals.length} rituals taken`
            }${isToday ? ", today" : ""}`;

            return (
              <View key={day} style={styles.slot}>
                <Pressable
                  disabled={isFuture}
                  onPress={() => openDay(dateStr)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityHint={isFuture ? undefined : "Opens this day to change it"}
                  style={[
                    styles.day,
                    some && { backgroundColor: someTint },
                    all && { backgroundColor: c.done },
                    isToday && styles.dayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isFuture && styles.dayTextFuture,
                      all && { color: c.onDone },
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: c.done }]} />
            <Text style={styles.legendText}>All taken</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: someTint }]} />
            <Text style={styles.legendText}>Some</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: c.well }]} />
            <Text style={styles.legendText}>None</Text>
          </View>
        </View>
        <Text style={styles.tapHint}>Tap a day to change it.</Text>

        <Text style={styles.sectionTitle}>{isCurrentMonth ? "This month" : MONTH_NAMES[view.month]}</Text>
        {rituals.length === 0 && <Text style={styles.noRituals}>No rituals yet.</Text>}
        {rituals.map((ritual) => {
          const days = ritual.completedDates.filter((d) => d.startsWith(prefix)).length;
          const { Icon } = getRitualIcon(ritual.icon);
          return (
            <View style={styles.ritualRow} key={ritual.id}>
              <Icon size={22} color={c.inkMuted} strokeWidth={2} />
              <Text style={styles.ritualName}>{ritual.name}</Text>
              <Text style={styles.ritualCount}>
                {days} {days === 1 ? "day" : "days"}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <DaySheet
        visible={sheetOpen}
        date={sheetDate}
        rituals={rituals}
        onToggle={toggleCompleted}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.ground,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 22,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: c.ink,
      letterSpacing: -0.6,
    },
    shareButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.well,
      alignItems: "center",
      justifyContent: "center",
    },
    monthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14,
      marginBottom: 10,
    },
    arrow: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.well,
      alignItems: "center",
      justifyContent: "center",
    },
    arrowOff: {
      opacity: 0.35,
    },
    monthText: {
      flex: 1,
      alignItems: "center",
    },
    month: {
      fontSize: 17,
      fontWeight: "700",
      color: c.ink,
    },
    monthMeta: {
      fontSize: 13,
      color: c.inkMuted,
      fontVariant: ["tabular-nums"],
    },
    dow: {
      flexDirection: "row",
      marginBottom: 6,
    },
    dowLabel: {
      flex: 1,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "600",
      color: c.inkMuted,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    slot: {
      width: `${100 / 7}%`,
      padding: 3,
    },
    day: {
      aspectRatio: 1,
      borderRadius: 999,
      backgroundColor: c.well,
      alignItems: "center",
      justifyContent: "center",
    },
    dayToday: {
      boxShadow: `0px 0px 0px 2px ${c.ground}, 0px 0px 0px 4px ${c.ink}`,
    },
    dayText: {
      fontSize: 13,
      fontWeight: "600",
      color: c.ink,
      fontVariant: ["tabular-nums"],
    },
    dayTextFuture: {
      color: c.inkMuted,
      fontWeight: "500",
    },
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      marginTop: 14,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: 12,
      color: c.inkMuted,
    },
    tapHint: {
      fontSize: 12,
      color: c.inkMuted,
      marginTop: 6,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: c.inkMuted,
      marginBottom: 4,
    },
    noRituals: {
      fontSize: 15,
      color: c.inkMuted,
      paddingVertical: 12,
    },
    ritualRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 52,
      borderBottomWidth: 1,
      borderBottomColor: c.hairline,
    },
    ritualName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: c.ink,
    },
    ritualCount: {
      width: 64,
      textAlign: "right",
      fontSize: 14,
      color: c.inkMuted,
      fontVariant: ["tabular-nums"],
    },
  });
}
