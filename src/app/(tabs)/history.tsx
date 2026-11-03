import { StorageNotice } from '@/components/StorageNotice';
import { DaySheet } from '@/components/DaySheet';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenTitle } from '@/components/ui/ScreenParts';
import { COPY, daysLine, monthDosesLine } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { TYPE } from '@/constants/type';
import { useRituals } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { useToday } from '@/hooks/useToday';
import { dayLabel } from '@/utils/a11y';
import { earliestMonth, MONTH_NAMES, MonthView, monthIndex, shiftMonth } from '@/utils/calendar';
import { fromDateString } from '@/utils/dates';
import { historyWeeks, ritualDaysInMonth } from '@/utils/historyModel';
import { buildMonthCard } from '@/utils/monthCard';
import { haptic } from '@/utils/haptics';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Share } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function HistoryScreen() {
  const router = useRouter();
  const c = useColors();
  const { rituals } = useRituals();
  const today = useToday();
  const hasRituals = rituals.length > 0;

  const todayDate = fromDateString(today);
  const current: MonthView = { year: todayDate.getFullYear(), month: todayDate.getMonth() };

  // null means "follow the current month", so the view moves on by itself at month end.
  const [picked, setPicked] = useState<MonthView | null>(null);
  const view = picked ?? current;

  const earliest = earliestMonth(
    rituals.flatMap((r) => [...r.completedDates, r.createdAt.slice(0, 10)]),
    current
  );
  const canGoBack = monthIndex(view) > monthIndex(earliest);
  const canGoForward = monthIndex(view) < monthIndex(current);

  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const weeks = historyWeeks(rituals, view, today);
  const doses = buildMonthCard(rituals, view, today).doses;
  const monthName = MONTH_NAMES[view.month];

  const goTo = (delta: number) => {
    haptic.flip();
    const next = shiftMonth(view, delta);
    setPicked(monthIndex(next) === monthIndex(current) ? null : next);
  };

  const openDay = (date: string) => {
    haptic.dayTap();
    setSheetDate(date);
    setSheetOpen(true);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.ground }}>
      <StorageNotice />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <ScreenTitle
          title={COPY.history.title}
          right={
            hasRituals ? (
              <IconButton
                icon={Share}
                label={`Share ${monthName} ${view.year}`}
                onPress={() =>
                  router.push({ pathname: '/share-month', params: { year: String(view.year), month: String(view.month) } })
                }
              />
            ) : undefined
          }
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 8, paddingBottom: 2 }}>
          <IconButton icon={ChevronLeft} label="Previous month" disabled={!canGoBack} onPress={() => goTo(-1)} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <AppText accessibilityRole="header" style={{ fontSize: 17, lineHeight: 22, fontWeight: '700' }}>
              {monthName} {view.year}
            </AppText>
            <AppText style={[TYPE.small, { color: c.muted }]}>{monthDosesLine(doses)}</AppText>
          </View>
          <IconButton icon={ChevronRight} label="Next month" disabled={!canGoForward} onPress={() => goTo(1)} />
        </View>

        <View
          style={{ flexDirection: 'row', gap: LAYOUT.monthGap, paddingTop: 10, paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 6 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {DAY_LETTERS.map((letter, i) => (
            <AppText key={i} style={[TYPE.tiny, { flex: 1, textAlign: 'center', color: c.muted }]}>
              {letter}
            </AppText>
          ))}
        </View>

        <View style={{ gap: LAYOUT.monthGap, paddingHorizontal: LAYOUT.screenPadding }}>
          {weeks.map((week, row) => (
            <View key={row} style={{ flexDirection: 'row', gap: LAYOUT.monthGap }}>
              {week.map((cell, col) => {
                if (cell === null) return <View key={col} style={{ flex: 1, aspectRatio: 1 }} />;
                const { state, isToday } = cell;
                const future = state === 'future';
                const done = future ? 0 : rituals.filter((r) => r.completedDates.includes(cell.date)).length;
                return (
                  <Pressable
                    key={col}
                    disabled={future || !hasRituals}
                    onPress={() => openDay(cell.date)}
                    accessibilityRole="button"
                    accessibilityLabel={dayLabel(cell.date, today, done, rituals.length)}
                    accessibilityHint={future || !hasRituals ? undefined : 'Opens this day'}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor:
                        state === 'all' ? c.accent : state === 'some' ? c.tint : future ? 'transparent' : c.surface,
                      boxShadow: isToday ? `0px 0px 0px 2px ${c.ground}, 0px 0px 0px 4px ${c.text}` : undefined,
                    }}
                  >
                    <AppText
                      maxFontSizeMultiplier={1.15}
                      style={{
                        fontSize: 15,
                        fontWeight: future ? '500' : '600',
                        fontVariant: ['tabular-nums'],
                        color: state === 'all' ? c.onAccent : future ? c.muted : c.text,
                      }}
                    >
                      {cell.day}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {hasRituals ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18, paddingTop: 14, paddingHorizontal: LAYOUT.screenPadding }}>
              <LegendItem color={c.accent} label={COPY.history.legendAll} />
              <LegendItem color={c.tint} label={COPY.history.legendSome} />
              <LegendItem color={c.surface} ring={c.line} label={COPY.history.legendNone} />
            </View>

            <AppText style={[TYPE.label, { color: c.muted, paddingTop: 14, paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 4 }]}>
              {monthName}
            </AppText>
            <View style={{ paddingHorizontal: LAYOUT.screenPadding }}>
              {rituals.map((ritual, i) => (
                <View
                  key={ritual.id}
                  accessible
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: LAYOUT.smallButtonHeight,
                    borderBottomWidth: i < rituals.length - 1 ? 1 : 0,
                    borderBottomColor: c.line,
                  }}
                >
                  <AppText style={{ flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '600' }}>{ritual.name}</AppText>
                  <AppText style={{ fontSize: 15, lineHeight: 20, fontWeight: '500', color: c.muted, fontVariant: ['tabular-nums'] }}>
                    {daysLine(ritualDaysInMonth(ritual.completedDates, view))}
                  </AppText>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={{ paddingTop: 30, paddingHorizontal: LAYOUT.screenPadding, gap: 4 }}>
            <AppText style={{ fontSize: 17, lineHeight: 22, fontWeight: '600' }}>{COPY.history.noRitualsTitle}</AppText>
            <AppText style={{ fontSize: 15, lineHeight: 21, fontWeight: '400', color: c.muted }}>{COPY.history.noRitualsBody}</AppText>
          </View>
        )}
      </ScrollView>

      <DaySheet visible={sheetOpen} date={sheetDate} rituals={rituals} onClose={() => setSheetOpen(false)} />
    </SafeAreaView>
  );
}

function LegendItem({ color, ring, label }: { color: string; ring?: string; label: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          boxShadow: ring ? `inset 0px 0px 0px 1px ${ring}` : undefined,
        }}
      />
      <AppText style={{ fontSize: 12, lineHeight: 15, fontWeight: '500', color: c.muted }}>{label}</AppText>
    </View>
  );
}
