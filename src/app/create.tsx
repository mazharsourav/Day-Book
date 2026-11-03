import { ConfirmSheet } from '@/components/ConfirmSheet';
import { IconPicker } from '@/components/IconPicker';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { ModalCard } from '@/components/ui/ModalCard';
import { TickCircle } from '@/components/ui/TickCircle';
import { COPY, deleteRitualTitle, streakLine } from '@/constants/copy';
import { LAYOUT, TABLET } from '@/constants/layout';
import { getRitualIcon } from '@/constants/ritualIcons';
import { MAX_FONT_SCALE, TYPE } from '@/constants/type';
import { useRituals } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { useToday } from '@/hooks/useToday';
import { RitualIconType } from '@/types';
import { computeStreak } from '@/utils/streak';
import { canSaveRitualName, cleanRitualName, RITUAL_NAME_MAX } from '@/utils/todayModel';
import { haptic } from '@/utils/haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// "New ritual", or "Edit ritual" when an id is passed: a card over the dimmed screen.
export default function RitualFormScreen() {
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { rituals, addRitual, updateRitual, deleteRitual } = useRituals();
  const tablet = useLayoutMode() !== 'phone';
  const today = useToday();

  const existing = id ? rituals.find((r) => r.id === id) : undefined;
  const isEdit = existing !== undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState<RitualIconType>(existing?.icon ?? 'flame');
  const [note, setNote] = useState(existing?.note ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canSave = canSaveRitualName(name);

  // When the note is being typed in, scroll so it sits above the keyboard, also when moving
  // straight from the name field with the keyboard already up.
  const scrollRef = useRef<ScrollView>(null);
  const noteY = useRef(0);
  const noteFocused = useRef(false);
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      if (noteFocused.current) scrollToY(scrollRef.current, noteY.current);
    });
    return () => sub.remove();
  }, []);
  const handleNoteFocus = () => {
    noteFocused.current = true;
    if (Keyboard.isVisible()) setTimeout(() => scrollToY(scrollRef.current, noteY.current), 50);
  };

  const close = () => router.back();

  const handleSave = () => {
    if (!canSave) return;
    haptic.save();
    const changes = { name: cleanRitualName(name), icon, note: note.trim() };
    if (existing) {
      updateRitual(existing.id, changes);
    } else {
      addRitual({ id: Date.now().toString(), ...changes, completedDates: [], createdAt: new Date().toISOString() });
    }
    close();
  };

  const handleDelete = () => {
    if (!existing) return;
    haptic.deleteConfirm();
    setConfirmOpen(false);
    // The ritual screen behind this form goes too, so return to Today.
    router.dismissTo('/');
    deleteRitual(existing.id);
  };

  const field = {
    backgroundColor: c.surface,
    borderRadius: LAYOUT.fieldRadius,
    padding: LAYOUT.fieldPadding,
    color: c.text,
  } as const;

  const nameField = (
          <TextInput
            value={name}
            onChangeText={setName}
            accessibilityLabel="Ritual name"
            placeholder={COPY.ritual.namePlaceholder}
            placeholderTextColor={c.muted}
            selectionColor={c.accent}
            cursorColor={c.accent}
            maxLength={RITUAL_NAME_MAX}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            autoFocus={!isEdit}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            style={[field, { minHeight: LAYOUT.fieldMinHeight, fontSize: 17, fontWeight: '500' }]}
          />
  );

  const noteField = (
          <TextInput
            value={note}
            onChangeText={setNote}
            onFocus={handleNoteFocus}
            onBlur={() => (noteFocused.current = false)}
            accessibilityLabel="Note"
            multiline
            placeholder={COPY.ritual.notePlaceholder}
            placeholderTextColor={c.muted}
            selectionColor={c.accent}
            cursorColor={c.accent}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            textAlignVertical="top"
            style={[field, { minHeight: LAYOUT.fieldAreaMinHeight, fontSize: 16, lineHeight: 23, fontWeight: '500' }]}
          />
  );

  const deleteButton = isEdit && (
    <Button
      variant="soft"
      label={COPY.ritual.deleteRitual}
      icon={Trash}
      iconSize={18}
      iconStrokeWidth={2}
      accessibilityHint="Asks first"
      onPress={() => setConfirmOpen(true)}
      style={{ marginTop: 28 }}
    />
  );

  return (
    <>
      <ModalCard
        title={isEdit ? COPY.ritual.editTitle : COPY.ritual.newTitle}
        left={{ label: COPY.common.cancel, onPress: close, hint: 'Closes without saving' }}
        right={{
          label: isEdit ? COPY.common.save : COPY.common.add,
          onPress: handleSave,
          accent: true,
          disabled: !canSave,
          hint: canSave ? undefined : 'Enter a name first',
        }}
        wide={tablet}
      >
        {tablet ? (
          // Tablets (frame J): name, note and a live preview on the left, the icons on the right.
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', gap: 28, paddingTop: 10, paddingHorizontal: 24, paddingBottom: 24 }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <FieldLabel first>{COPY.ritual.nameLabel}</FieldLabel>
              {nameField}
              <FieldLabel>{COPY.ritual.noteLabel}</FieldLabel>
              {noteField}
              <FieldLabel>{COPY.ritual.previewLabel}</FieldLabel>
              <RitualPreview
                name={cleanRitualName(name)}
                icon={icon}
                streak={existing ? computeStreak(existing.completedDates, today) : 0}
              />
              {deleteButton}
            </View>
            <View style={{ width: TABLET.formIcons }}>
              <FieldLabel first>{COPY.ritual.iconLabel}</FieldLabel>
              <IconPicker selected={icon} onSelect={setIcon} alwaysSix />
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10, paddingHorizontal: LAYOUT.screenPadding, paddingBottom: insets.bottom + 32 }}
          >
            <FieldLabel first>{COPY.ritual.nameLabel}</FieldLabel>
            {nameField}

            <FieldLabel>{COPY.ritual.iconLabel}</FieldLabel>
            <IconPicker selected={icon} onSelect={setIcon} />

            <FieldLabel onLayout={(y) => (noteY.current = y)}>{COPY.ritual.noteLabel}</FieldLabel>
            {noteField}

            {deleteButton}
          </ScrollView>
        )}
      </ModalCard>

      {existing && (
        <ConfirmSheet
          visible={confirmOpen}
          title={deleteRitualTitle(existing.name)}
          message={COPY.ritual.deleteBody}
          cancelLabel={COPY.ritual.keepIt}
          confirmLabel={COPY.ritual.deleteRitual}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}

// Tablets: the new ritual as it will look on Today, updated while typing (frame J). Before a name
// is typed it shows the grey placeholder.
function RitualPreview({ name, icon, streak }: { name: string; icon: RitualIconType; streak: number }) {
  const c = useColors();
  const { Icon } = getRitualIcon(icon);
  return (
    <View
      accessible
      accessibilityLabel={`${COPY.ritual.previewLabel}: ${name || COPY.ritual.namePlaceholder}, ${streakLine(streak)}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: LAYOUT.rowGap, minHeight: LAYOUT.rowMinHeight }}
    >
      <TickCircle checked={false} name={name} locked />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText numberOfLines={1} style={[TYPE.ritualName, !name && { color: c.muted, fontWeight: '500' }]}>
          {name || COPY.ritual.namePlaceholder}
        </AppText>
        <AppText style={[TYPE.small, { color: c.muted, marginTop: 1 }]}>{streakLine(streak)}</AppText>
      </View>
      <Icon size={20} color={c.muted} strokeWidth={1.75} />
    </View>
  );
}

// Scrolls the form so a point sits a little below the top of the card.
function scrollToY(scroll: ScrollView | null, y: number) {
  scroll?.scrollTo({ y: Math.max(0, y - 30), animated: true });
}
