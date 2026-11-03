import { StorageNotice } from '@/components/StorageNotice';
import { WeekDots } from '@/components/WeekDots';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Column } from '@/components/ui/Panes';
import { BackRow, EmptyState, HintLine } from '@/components/ui/ScreenParts';
import { COPY, streakLine } from '@/constants/copy';
import { LAYOUT, TABLET } from '@/constants/layout';
import { TYPE } from '@/constants/type';
import { useRituals } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { useToday } from '@/hooks/useToday';
import { isEditableRitualDay } from '@/utils/dayRules';
import { computeStreak } from '@/utils/streak';
import { haptic } from '@/utils/haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RitualScreen() {
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rituals, toggleCompleted } = useRituals();
  const ritual = rituals.find((r) => r.id === id);
  const today = useToday();
  const tablet = useLayoutMode() !== 'phone';

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!ritual) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.ground }}>
        <StorageNotice />
        <BackRow label={COPY.common.today} onBack={goBack} />
        <EmptyState
          title={COPY.ritual.notFoundTitle}
          body={COPY.ritual.notFoundBody}
          action={{ label: COPY.ritual.goBack, onPress: goBack, variant: 'soft' }}
        />
      </SafeAreaView>
    );
  }

  const doneToday = ritual.completedDates.includes(today);
  const streak = computeStreak(ritual.completedDates, today);
  const toggle = (date: string) => {
    if (isEditableRitualDay(date, today)) toggleCompleted(ritual.id, date);
  };
  // Mazhar, 3 November 2026: the button only ticks. Once done it reads "Done for today" and goes back
  // to Today; unticking is done with today's circle in the week above.
  const markDone = () => {
    if (doneToday) return;
    haptic.tick();
    toggle(today);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.ground }}>
      <StorageNotice />
      {/* Tablets show a ritual beside Today's list; opened on its own it is one centred column. */}
      <Column width={tablet ? TABLET.column : undefined}>
      <BackRow label={COPY.common.today}
        onBack={goBack}
        right={{
          label: COPY.common.edit,
          hint: `Edit ${ritual.name}`,
          onPress: () => router.push({ pathname: '/create', params: { id: ritual.id } }),
        }}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: LAYOUT.buttonHeight + insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 6, paddingHorizontal: LAYOUT.screenPadding }}>
          <AppText accessibilityRole="header" style={TYPE.screenTitle}>
            {ritual.name}
          </AppText>
          <AppText style={{ fontSize: 17, lineHeight: 22, fontWeight: '500', color: c.muted, marginTop: 6 }}>
            {streak > 0 ? streakLine(streak) : COPY.ritual.noStreak}
          </AppText>
        </View>

        <SectionLabel>{COPY.ritual.thisWeek}</SectionLabel>
        <WeekDots name={ritual.name} completedDates={ritual.completedDates} today={today} onToggleDate={toggle} />
        <HintLine top={6}>{COPY.ritual.changeRule}</HintLine>

        {ritual.note.trim().length > 0 && (
          <>
            <SectionLabel>{COPY.ritual.note}</SectionLabel>
            <View
              style={{
                marginTop: 6,
                marginHorizontal: LAYOUT.screenPadding,
                backgroundColor: c.surface,
                borderRadius: LAYOUT.noteRadius,
                paddingVertical: 14,
                paddingHorizontal: 16,
              }}
            >
              <AppText style={TYPE.note}>{ritual.note}</AppText>
            </View>
          </>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', left: LAYOUT.screenPadding, right: LAYOUT.screenPadding, bottom: Math.max(insets.bottom, 18) + 16 }}>
        {doneToday ? (
          <Button
            variant="soft"
            label={COPY.ritual.doneToday}
            icon={Check}
            iconStrokeWidth={3}
            accessibilityHint={`Goes back to ${COPY.common.today}`}
            onPress={goBack}
          />
        ) : (
          <Button label={COPY.ritual.markDone} onPress={markDone} />
        )}
      </View>
      </Column>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  const c = useColors();
  return (
    <AppText style={[TYPE.label, { color: c.muted, paddingTop: 26, paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 4 }]}>
      {children}
    </AppText>
  );
}
