import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { HintLine } from '@/components/ui/ScreenParts';
import { COPY, streakLine } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { Ritual } from '@/types';
import { ritualDayLabel } from '@/utils/a11y';
import { haptic } from '@/utils/haptics';
import { computeStreak } from '@/utils/streak';
import { ritualMonth } from '@/utils/todayModel';
import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
// The month is kept to this width, so its circles stay the size of History's.
const MONTH_MAX = 460;

interface RitualPaneProps {
  ritual: Ritual;
  today: string;
  // Called only for today and yesterday.
  onToggleDate: (date: string) => void;
  onEdit: () => void;
}

// Tablets (frame D): the chosen ritual beside the list. Its whole month instead of one week, so the
// space does real work. The same rules as the ritual screen: only today and yesterday can change, and
// the button only ticks; once done it reads "Done for today" and stays.
export function RitualPane({ ritual, today, onToggleDate, onEdit }: RitualPaneProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const streak = computeStreak(ritual.completedDates, today);
  const doneToday = ritual.completedDates.includes(today);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: LAYOUT.buttonHeight + 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, paddingHorizontal: LAYOUT.screenPadding }}>
          <AppText accessibilityRole="header" style={[TYPE.screenTitle, { flex: 1 }]}>
            {ritual.name}
          </AppText>
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityHint={`Edit ${ritual.name}`}
            style={{ minHeight: LAYOUT.smallButtonHeight, paddingHorizontal: 10, marginRight: -10, justifyContent: 'center' }}
          >
            <AppText style={[TYPE.button, { color: c.accent }]}>{COPY.common.edit}</AppText>
          </Pressable>
        </View>
        <AppText style={{ fontSize: 17, lineHeight: 22, fontWeight: '500', color: c.muted, marginTop: 6, paddingHorizontal: LAYOUT.screenPadding }}>
          {streak > 0 ? streakLine(streak) : COPY.ritual.noStreak}
        </AppText>

        <SectionLabel>{COPY.ritual.thisMonth}</SectionLabel>
        <View style={{ maxWidth: MONTH_MAX, paddingHorizontal: LAYOUT.screenPadding }}>
          <View
            style={{ flexDirection: 'row', gap: LAYOUT.monthGap, paddingTop: 10, paddingBottom: 6 }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {DAY_LETTERS.map((letter, i) => (
              <AppText key={i} style={[TYPE.tiny, { flex: 1, textAlign: 'center', color: c.muted }]}>
                {letter}
              </AppText>
            ))}
          </View>
          <View style={{ gap: LAYOUT.monthGap }}>
            {ritualMonth(ritual.completedDates, today).map((week, row) => (
              <View key={row} style={{ flexDirection: 'row', gap: LAYOUT.monthGap }}>
                {week.map((day, col) => {
                  if (day === null) return <View key={col} style={{ flex: 1, aspectRatio: 1 }} />;
                  const future = day.kind === 'future';
                  const editable = day.kind === 'editable';
                  const spoken = ritualDayLabel(day.date, today, day.done);
                  return (
                    <Pressable
                      key={col}
                      disabled={!editable}
                      onPress={() => onToggleDate(day.date)}
                      accessibilityRole={editable ? 'checkbox' : undefined}
                      accessibilityState={editable ? { checked: day.done } : undefined}
                      accessibilityLabel={editable ? spoken.label : `${spoken.label}${future ? '' : day.done ? ' Done.' : ' Not done.'}`}
                      accessibilityHint={spoken.hint}
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: day.done ? c.accent : future ? 'transparent' : c.surface,
                        boxShadow: day.isToday ? `0px 0px 0px 2px ${c.ground}, 0px 0px 0px 4px ${c.text}` : undefined,
                      }}
                    >
                      <AppText
                        maxFontSizeMultiplier={1.15}
                        style={{
                          fontSize: 16,
                          fontWeight: future ? '500' : '600',
                          fontVariant: ['tabular-nums'],
                          color: day.done ? c.onAccent : future ? c.muted : c.text,
                        }}
                      >
                        {day.day}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
        <HintLine top={10}>{COPY.ritual.changeRule}</HintLine>

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

      <View style={{ position: 'absolute', left: LAYOUT.screenPadding, right: LAYOUT.screenPadding, bottom: Math.max(insets.bottom, 0) + 7 }}>
        {/* The list stays beside it, so "Done for today" has nowhere to go back to: it only says so. */}
        {doneToday ? (
          <Button variant="soft" label={COPY.ritual.doneToday} icon={Check} iconStrokeWidth={3} onPress={() => {}} />
        ) : (
          <Button
            label={COPY.ritual.markDone}
            onPress={() => {
              haptic.tick();
              onToggleDate(today);
            }}
          />
        )}
      </View>
    </View>
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
