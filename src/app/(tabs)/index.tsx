import { StorageNotice } from '@/components/StorageNotice';
import { DayStrip } from '@/components/DayStrip';
import { RitualRow } from '@/components/RitualRow';
import { AppText } from '@/components/ui/AppText';
import { NewBar } from '@/components/ui/NewBar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState, HintLine, ScreenTitle } from '@/components/ui/ScreenParts';
import { COPY } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { useRituals } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { useToday } from '@/hooks/useToday';
import { dayLabel } from '@/utils/a11y';
import { isEditableRitualDay, selectedDayAfterRollover } from '@/utils/dayRules';
import { useFocusRequest } from '@/utils/focusRequest';
import { computeStreak } from '@/utils/streak';
import { dayHeading, doneOn, showAllDoneNote, todayStrip, todaySubtitle } from '@/utils/todayModel';
import { haptic } from '@/utils/haptics';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TodayScreen() {
  const router = useRouter();
  const c = useColors();
  const { rituals, toggleCompleted } = useRituals();
  const today = useToday();

  // The day being shown. At midnight it follows today only if it was showing today.
  const [selected, setSelected] = useState(today);
  const [shownToday, setShownToday] = useState(today);
  if (shownToday !== today) {
    setShownToday(today);
    setSelected(selectedDayAfterRollover(selected, shownToday, today));
  }
  // A tapped evening reminder opens Today on today.
  const focus = useFocusRequest();
  const [seenFocus, setSeenFocus] = useState(focus?.n ?? 0);
  if (focus && focus.n !== seenFocus) {
    setSeenFocus(focus.n);
    if (focus.tab === 'today') setSelected(focus.day);
  }

  const isToday = selected === today;
  const editable = isEditableRitualDay(selected, today);
  const total = rituals.length;
  const done = doneOn(rituals, selected);

  const handleToggle = useCallback(
    (id: string) => {
      if (!isEditableRitualDay(selected, today)) return;
      const ticking = rituals.some((r) => r.id === id && !r.completedDates.includes(selected));
      toggleCompleted(id, selected);
      // The last one of today: one soft tap, as "Nothing left for today" fades in after the bar.
      if (ticking && selected === today && doneOn(rituals, selected) === rituals.length - 1) {
        setTimeout(haptic.allDone, MOTION.allDoneWords);
      }
    },
    [toggleCompleted, rituals, selected, today]
  );

  const handleOpen = useCallback((id: string) => router.push(`/ritual/${id}`), [router]);
  const handleNew = () => router.push('/create');

  const handleSelect = (date: string) => {
    haptic.dayTap();
    setSelected(date);
  };

  if (total === 0) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.ground }}>
        <StorageNotice />
        <ScreenTitle title={COPY.common.today} subtitle={todaySubtitle(today, today)} />
        <EmptyState
          title={COPY.today.firstRunTitle}
          body={COPY.today.firstRunBody}
          action={{ label: COPY.today.newRitual, icon: Plus, onPress: handleNew }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.ground }}>
      <StorageNotice />
      <ScrollView contentContainerStyle={{ paddingBottom: LAYOUT.newBarHeight + 12 }} showsVerticalScrollIndicator={false}>
        <ScreenTitle title={dayHeading(selected, today)} subtitle={todaySubtitle(selected, today)} />
        <DayStrip
          days={todayStrip(today, selected, rituals)}
          onSelect={handleSelect}
          labelFor={(d) => dayLabel(d.date, today, doneOn(rituals, d.date), total)}
        />
        <ProgressBar done={done} total={total} isToday={isToday} />

        {/* Picking a day fades the list to the new one (motion table: 150 ms). */}
        <Animated.View key={selected} entering={FadeIn.duration(MOTION.dayListFade)} style={{ paddingTop: 8, paddingHorizontal: LAYOUT.screenPadding }}>
          {rituals.map((ritual, i) => (
            <RitualRow
              key={ritual.id}
              ritual={ritual}
              done={ritual.completedDates.includes(selected)}
              streak={computeStreak(ritual.completedDates, today)}
              locked={!editable}
              last={i === rituals.length - 1}
              onToggle={handleToggle}
              onOpen={handleOpen}
            />
          ))}
        </Animated.View>

        {!editable && <HintLine>{COPY.today.olderDayHint}</HintLine>}
        {showAllDoneNote(done, total, isToday) && (
          // The words follow the bar: they fade in once it has reached the end.
          <Animated.View entering={FadeIn.delay(MOTION.tickBar).duration(MOTION.allDoneWords)}>
          <AppText
            style={{
              textAlign: 'center',
              fontSize: 15,
              lineHeight: 21,
              fontWeight: '400',
              color: c.muted,
              paddingTop: 26,
              paddingHorizontal: LAYOUT.screenPadding,
            }}
          >
            {COPY.today.allDoneNote}
          </AppText>
          </Animated.View>
        )}
      </ScrollView>
      <NewBar label={COPY.today.newRitual} onPress={handleNew} />
    </SafeAreaView>
  );
}
