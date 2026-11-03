import { StorageNotice } from '@/components/StorageNotice';
import { AppText } from '@/components/ui/AppText';
import { BackRow } from '@/components/ui/ScreenParts';
import { TickCircle } from '@/components/ui/TickCircle';
import { COPY } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { getRitualIcon } from '@/constants/ritualIcons';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { useUses24Hour } from '@/hooks/useUses24Hour';
import { DEFAULT_REMINDERS } from '@/utils/reminderSettings';
import { timeLabel } from '@/utils/timeFormat';
import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// How Day Book works (frames 45 to 47): one calm page, each part shown with the real piece it describes.
// The examples are pictures for reading, so the screen reader skips them and reads the words.
export default function HowItWorksScreen() {
  const router = useRouter();
  const c = useColors();
  const uses24 = useUses24Hour();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/settings'));
  const [rituals, fixing, week, history, reminders, data] = COPY.how.sections;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.ground }}>
      <StorageNotice />
      <BackRow label={COPY.how.back} onBack={goBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 6, paddingHorizontal: LAYOUT.screenPadding }}>
          <AppText accessibilityRole="header" style={TYPE.screenTitle}>
            {COPY.how.title}
          </AppText>
          <AppText style={{ fontSize: 17, lineHeight: 25, fontWeight: '500', color: c.muted, paddingTop: 12 }}>{COPY.how.lead}</AppText>
        </View>

        <Section title={rituals.title} body={rituals.body}>
          {COPY.how.sampleRituals.map((r, i) => (
            <SampleRow key={r.name} done={r.done} last={i === COPY.how.sampleRituals.length - 1}>
              <View style={{ flex: 1 }}>
                <AppText style={[TYPE.ritualName, r.done && { color: c.muted, fontWeight: '500' }]}>{r.name}</AppText>
                <AppText style={[TYPE.small, { color: c.muted, marginTop: 1 }]}>{r.meta}</AppText>
              </View>
              <RitualIcon icon={r.icon} />
            </SampleRow>
          ))}
        </Section>

        <Section title={fixing.title} body={fixing.body}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Trio label={COPY.how.olderDays} sub={COPY.how.lookOnly}>
              <TickCircle checked name="" size="week" locked />
            </Trio>
            <Trio label={COPY.common.yesterday} sub={COPY.how.canChange}>
              <TickCircle checked name="" size="week" />
            </Trio>
            <Trio label={COPY.common.today} sub={COPY.how.canChange}>
              <TickCircle checked={false} name="" size="week" strongRing />
            </Trio>
          </View>
        </Section>

        <Section title={week.title} body={week.body}>
          {COPY.how.sampleTasks.map((t, i) => (
            <SampleRow key={t.title} done={t.done} last={i === COPY.how.sampleTasks.length - 1}>
              <AppText
                style={[
                  TYPE.row,
                  { flex: 1 },
                  t.done && { color: c.muted, textDecorationLine: 'line-through', textDecorationColor: c.muted },
                ]}
              >
                {t.title}
              </AppText>
            </SampleRow>
          ))}
        </Section>

        <Section title={history.title} body={history.body}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Trio label={COPY.history.legendAll}>
              <DayDot day={12} background={c.accent} color={c.onAccent} />
            </Trio>
            <Trio label={COPY.history.legendSome}>
              <DayDot day={13} background={c.tint} color={c.text} />
            </Trio>
            <Trio label={COPY.history.legendNone}>
              <DayDot day={14} background={c.surface} color={c.text} />
            </Trio>
          </View>
        </Section>

        <Section title={reminders.title} body={reminders.body}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TimePill label={COPY.how.rituals} value={timeLabel(DEFAULT_REMINDERS.evening, uses24)} />
            <TimePill label={COPY.how.tasks} value={timeLabel(DEFAULT_REMINDERS.morning, uses24)} />
          </View>
        </Section>

        <Section title={data.title} body={data.body} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ marginTop: 24, marginHorizontal: LAYOUT.screenPadding, paddingTop: 22, borderTopWidth: 1, borderTopColor: c.line }}>
      <AppText accessibilityRole="header" style={{ fontSize: 20, lineHeight: 25, fontWeight: '700', letterSpacing: -0.4 }}>
        {title}
      </AppText>
      <AppText style={{ fontSize: 16, lineHeight: 24, fontWeight: '400', marginTop: 6 }}>{body}</AppText>
      {children && (
        <View style={{ marginTop: 12 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {children}
        </View>
      )}
    </View>
  );
}

// A ritual or task row as it looks on Today or Week, without the touch.
function SampleRow({ done, last, children }: { done: boolean; last: boolean; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: LAYOUT.rowGap, minHeight: LAYOUT.sheetRowMinHeight }}>
      <TickCircle checked={done} name="" />
      {children}
      {!last && <View style={{ position: 'absolute', left: LAYOUT.rowLineInset, right: 0, bottom: 0, height: 1, backgroundColor: c.line }} />}
    </View>
  );
}

function RitualIcon({ icon }: { icon: string }) {
  const c = useColors();
  const { Icon } = getRitualIcon(icon);
  return (
    <View style={{ opacity: 0.85 }}>
      <Icon size={20} color={c.muted} strokeWidth={1.75} />
    </View>
  );
}

function Trio({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      {children}
      <AppText style={{ fontSize: 13, lineHeight: 17, fontWeight: '600', textAlign: 'center' }}>{label}</AppText>
      {sub && <AppText style={{ fontSize: 12, lineHeight: 15, fontWeight: '500', color: c.muted, marginTop: -4 }}>{sub}</AppText>}
    </View>
  );
}

function DayDot({ day, background, color }: { day: number; background: string; color: string }) {
  return (
    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: background, alignItems: 'center', justifyContent: 'center' }}>
      <AppText style={{ fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'], color }}>{day}</AppText>
    </View>
  );
}

function TimePill({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 }}>
      <AppText style={{ fontSize: 12, lineHeight: 15, fontWeight: '500', color: c.muted }}>{label}</AppText>
      <AppText style={{ fontSize: 15, lineHeight: 20, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{value}</AppText>
    </View>
  );
}
