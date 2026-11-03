import { DayStrip } from '@/components/DayStrip';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { IconButton } from '@/components/ui/IconButton';
import { ModalCard } from '@/components/ui/ModalCard';
import { COPY } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { MAX_FONT_SCALE, TYPE } from '@/constants/type';
import { useTasks } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { useToday } from '@/hooks/useToday';
import { canSaveTaskTitle, TASK_TITLE_MAX } from '@/utils/tasks';
import { dayDateLine } from '@/utils/todayModel';
import { canGoToEarlierFormWeek, formStrip, shiftWeek, weekRangeFor } from '@/utils/weekModel';
import { haptic } from '@/utils/haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Trash } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// "Add task" (with ?date=YYYY-MM-DD, the day chosen on Week) or "Edit task" (with ?id=...),
// a card over the dimmed screen. Opened only from Week; Edit only from a task's pencil.
export default function TaskFormScreen() {
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const { tasks, addTask, editTask, deleteTask, showUndo } = useTasks();

  const existing = params.id ? tasks.find((t) => t.id === params.id) : undefined;
  const isEdit = existing !== undefined;
  const startDate = existing?.date ?? (params.date && params.date >= today ? params.date : today);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(startDate);
  const canSave = canSaveTaskTitle(title);
  // A done task stays on the day it was planned for, so its Day picker is fixed.
  const dayFixed = existing?.done === true;

  const close = () => router.back();

  const handleSave = () => {
    if (!canSave) return;
    const result = existing ? editTask(existing.id, { title, date }) : addTask(title, date);
    if (!result.ok) return;
    haptic.save();
    close();
  };

  const handleDelete = () => {
    if (!existing) return;
    const result = deleteTask(existing.id);
    if (!result.ok || !result.before) return;
    haptic.deleteConfirm();
    // No question first: "Task deleted. Undo" shows on Week.
    showUndo(COPY.undo.taskDeleted, result.before);
    close();
  };

  const choose = (next: string) => {
    haptic.dayTap();
    setDate(next);
  };

  // Moving a week keeps the weekday, but never lands on a past day.
  const goWeek = (weeks: number) => {
    const next = shiftWeek(date, weeks);
    haptic.flip();
    setDate(next < today ? today : next);
  };

  const strip = formStrip(date, today).map((d) => (dayFixed ? { ...d, disabled: d.date !== date } : d));

  return (
    <ModalCard
      title={isEdit ? COPY.week.editTask : COPY.week.addTask}
      left={{ label: COPY.common.cancel, onPress: close, hint: 'Closes without saving' }}
      right={{
        label: isEdit ? COPY.common.save : COPY.common.add,
        onPress: handleSave,
        accent: true,
        disabled: !canSave,
        hint: canSave ? undefined : 'Enter a title first',
      }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 10, paddingHorizontal: LAYOUT.screenPadding, paddingBottom: insets.bottom + 32 }}
      >
        <FieldLabel first>{COPY.week.titleLabel}</FieldLabel>
        <TextInput
          value={title}
          onChangeText={setTitle}
          accessibilityLabel="Task title"
          placeholder={COPY.week.titlePlaceholder}
          placeholderTextColor={c.muted}
          selectionColor={c.accent}
          cursorColor={c.accent}
          maxLength={TASK_TITLE_MAX}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          autoFocus={!isEdit}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          style={{
            backgroundColor: c.surface,
            borderRadius: LAYOUT.fieldRadius,
            padding: LAYOUT.fieldPadding,
            minHeight: LAYOUT.fieldMinHeight,
            fontSize: 17,
            fontWeight: '500',
            color: c.text,
          }}
        />

        <FieldLabel>{COPY.week.dayLabel}</FieldLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton
            icon={ChevronLeft}
            label="Previous week"
            disabled={dayFixed || !canGoToEarlierFormWeek(date, today)}
            onPress={() => goWeek(-1)}
          />
          <AppText style={{ fontSize: 15, lineHeight: 20, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
            {weekRangeFor(date)}
          </AppText>
          <IconButton icon={ChevronRight} label="Next week" disabled={dayFixed} onPress={() => goWeek(1)} />
        </View>
        <View style={{ marginHorizontal: -LAYOUT.screenPadding }}>
          <DayStrip days={strip} onSelect={choose} labelFor={(d) => dayDateLine(d.date)} />
        </View>
        <AppText
          accessibilityLiveRegion="polite"
          style={{ fontSize: 15, lineHeight: 20, fontWeight: '600', textAlign: 'center', paddingTop: 2, paddingHorizontal: 4 }}
        >
          {dayDateLine(date)}
        </AppText>
        {dayFixed && (
          <AppText style={[TYPE.small, { color: c.muted, textAlign: 'center', paddingTop: 4 }]}>{COPY.week.doneCannotMove}</AppText>
        )}

        {isEdit && (
          <Button
            variant="soft"
            label={COPY.week.deleteTask}
            icon={Trash}
            iconSize={18}
            iconStrokeWidth={2}
            onPress={handleDelete}
            style={{ marginTop: 28 }}
          />
        )}
      </ScrollView>
    </ModalCard>
  );
}
