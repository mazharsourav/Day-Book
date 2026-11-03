import { ConfirmSheet } from '@/components/ConfirmSheet';
import { BlockedBox, PermissionSheet, TimeSheet } from '@/components/ReminderSheets';
import { ReminderTestInfo } from '@/components/ReminderTestInfo';
import { StorageNotice } from '@/components/StorageNotice';
import { AppText } from '@/components/ui/AppText';
import { Group, GroupFoot, GroupRow, GroupTitle } from '@/components/ui/Group';
import { ScreenTitle } from '@/components/ui/ScreenParts';
import { Segmented } from '@/components/ui/Segmented';
import { COPY, lastBackupLine, restoreQuestion, restoreSummary } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { AppearancePreference, useAppearance } from '@/context/AppearanceContext';
import { useRituals } from '@/context/DataContext';
import { useReminder } from '@/context/ReminderContext';
import { useColors } from '@/hooks/useColors';
import { useUses24Hour } from '@/hooks/useUses24Hour';
import { Ritual, Task } from '@/types';
import { backupFileName, buildBackup, parseBackup } from '@/utils/backup';
import { exportBackupFile, pickBackupText } from '@/utils/backupFiles';
import { haptic, setHapticsOn, useHapticsOn } from '@/utils/haptics';
import { longDate, readLastBackup, saveLastBackup } from '@/utils/lastBackup';
import { openPhoneSettings } from '@/utils/reminderNotifications';
import { ReminderKind, showBlockedBox } from '@/utils/reminderSettings';
import { timeLabel } from '@/utils/timeFormat';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Download, Upload } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChosenBackup {
  rituals: Ritual[];
  tasks: Task[];
  exportedAt: string | null;
  dropped: number;
}

const REFUSALS = {
  unreadable: COPY.restore.unreadableFile,
  'not-backup': COPY.restore.badFile,
  newer: COPY.restore.newerFile,
} as const;

const APPEARANCE: { key: AppearancePreference; label: string }[] = [
  { key: 'system', label: COPY.settings.system },
  { key: 'light', label: COPY.settings.light },
  { key: 'dark', label: COPY.settings.dark },
];

const REMINDER_WORDS: Record<ReminderKind, { title: string; sub: string }> = {
  evening: { title: COPY.settings.ritualReminder, sub: COPY.settings.eveningSub },
  morning: { title: COPY.settings.taskReminder, sub: COPY.settings.morningSub },
};

// Settings (frames 34 to 44): reminders, appearance, haptics, backup and About, as a grouped list.
export default function SettingsScreen() {
  const router = useRouter();
  const c = useColors();
  const { preference, setPreference } = useAppearance();
  const { rituals, tasks, replaceAll, canSave } = useRituals();
  const reminder = useReminder();
  const uses24 = useUses24Hour();
  const hapticsOn = useHapticsOn();

  const [message, setMessage] = useState<string | null>(null);
  const [chosen, setChosen] = useState<ChosenBackup | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  // The time sheet and the permission sheet. `opened` gives each time sheet a fresh start.
  const [timeKind, setTimeKind] = useState<ReminderKind>('evening');
  const [timeOpen, setTimeOpen] = useState(false);
  const [opened, setOpened] = useState(0);
  const [askingFor, setAskingFor] = useState<ReminderKind | null>(null);
  const [askKind, setAskKind] = useState<ReminderKind>('evening');

  useEffect(() => {
    readLastBackup()
      .then(setLastBackup)
      .catch(() => {});
  }, []);

  const handleSwitch = (kind: ReminderKind, on: boolean) => {
    if (reminder.setOn(kind, on) === 'explain-first') {
      setAskKind(kind);
      setAskingFor(kind);
    }
  };

  const openTime = (kind: ReminderKind) => {
    setTimeKind(kind);
    setOpened((n) => n + 1);
    setTimeOpen(true);
  };

  const handleSave = async () => {
    if (busy) return;
    setMessage(null);
    setBusy(true);
    try {
      const result = await exportBackupFile(buildBackup({ rituals, tasks }), backupFileName());
      if (result === 'unavailable') {
        setMessage(COPY.restore.sharingUnavailable);
      } else {
        const now = new Date();
        setLastBackup(now);
        saveLastBackup(now).catch(() => {});
      }
    } catch {
      setMessage(COPY.restore.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleChoose = async () => {
    setMessage(null);
    try {
      const text = await pickBackupText();
      if (text === null) return;
      const result = parseBackup(text);
      if (!result.ok) {
        setMessage(REFUSALS[result.reason]);
        return;
      }
      setChosen(result);
      setConfirmOpen(true);
    } catch {
      setMessage(COPY.restore.openFailed);
    }
  };

  const handleRestore = () => {
    if (!chosen) return;
    haptic.deleteConfirm();
    // A 1.0.0 backup has no tasks, so restoring it leaves none; the question said so first.
    replaceAll({ rituals: chosen.rituals, tasks: chosen.tasks });
    setConfirmOpen(false);
    setMessage(restoreSummary(chosen.rituals.length, chosen.tasks.length, chosen.dropped));
  };

  const exportedOn = chosen?.exportedAt ? longDate(new Date(chosen.exportedAt)) : COPY.restore.unknownDate;
  const box = !canSave ? COPY.restore.offWhileUnreadable : message;
  const { settings } = reminder;

  const reminderRows = (kind: ReminderKind) => [
    <GroupRow
      key={`${kind}-switch`}
      label={REMINDER_WORDS[kind].title}
      toggle={{ on: settings[kind].on, onChange: (on) => handleSwitch(kind, on) }}
      disabled={!reminder.supported}
    />,
    <GroupRow
      key={`${kind}-time`}
      label={COPY.settings.time}
      value={timeLabel(settings[kind], uses24)}
      onPress={() => openTime(kind)}
      dimmed={!settings[kind].on}
      disabled={!reminder.supported}
    />,
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.ground }}>
      <StorageNotice />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <ScreenTitle title={COPY.settings.title} />

        <GroupTitle>{COPY.settings.reminders}</GroupTitle>
        {reminder.supported && showBlockedBox(reminder.permission, settings) && (
          <BlockedBox onOpenSettings={() => openPhoneSettings().catch(() => {})} />
        )}
        <Group>{[...reminderRows('evening'), ...reminderRows('morning')]}</Group>
        <GroupFoot>{reminder.supported ? COPY.settings.remindersFoot : COPY.settings.remindersUnsupported}</GroupFoot>
        {/* TEMPORARY: Expo Go reminder test, development only. */}
        {__DEV__ && reminder.supported && <ReminderTestInfo />}

        <GroupTitle>{COPY.settings.appearance}</GroupTitle>
        <Segmented options={APPEARANCE} value={preference} onChange={setPreference} />

        <GroupTitle>{COPY.settings.feel}</GroupTitle>
        <Group>
          <GroupRow
            label={COPY.settings.haptics}
            toggle={{
              on: hapticsOn,
              onChange: setHapticsOn,
            }}
          />
        </Group>
        <GroupFoot>{COPY.settings.hapticsFoot}</GroupFoot>

        <GroupTitle>{COPY.settings.backup}</GroupTitle>
        <Group>
          <GroupRow label={COPY.settings.saveBackup} icon={Download} onPress={handleSave} chevron={false} />
          <GroupRow
            label={COPY.settings.restoreBackup}
            icon={Upload}
            onPress={handleChoose}
            chevron={false}
            disabled={!canSave}
          />
        </Group>
        {box !== null && (
          <View
            accessibilityLiveRegion="polite"
            style={{
              marginTop: 14,
              marginHorizontal: LAYOUT.screenPadding,
              backgroundColor: c.surface,
              borderRadius: LAYOUT.groupRadius,
              padding: 14,
            }}
          >
            <AppText style={{ fontSize: 15, lineHeight: 21, fontWeight: '400' }}>{box}</AppText>
          </View>
        )}
        <GroupFoot>{lastBackupLine(lastBackup ? longDate(lastBackup) : null)}</GroupFoot>

        <GroupTitle>{COPY.settings.about}</GroupTitle>
        <Group>
          <GroupRow label={COPY.settings.howItWorks} onPress={() => router.push('/how-it-works')} />
          <GroupRow label={COPY.settings.version} value={Constants.expoConfig?.version ?? ''} chevron={false} />
        </Group>
        <GroupFoot>{COPY.settings.aboutFoot}</GroupFoot>
      </ScrollView>

      <TimeSheet
        key={opened}
        visible={timeOpen}
        title={REMINDER_WORDS[timeKind].title}
        subtitle={REMINDER_WORDS[timeKind].sub}
        time={settings[timeKind]}
        uses24={uses24}
        onClose={(time) => {
          reminder.setTime(timeKind, time);
          setTimeOpen(false);
        }}
      />
      <PermissionSheet
        visible={askingFor !== null}
        onNotNow={() => setAskingFor(null)}
        onContinue={() => {
          setAskingFor(null);
          reminder.allowAndTurnOn(askKind).catch(() => {});
        }}
      />
      <ConfirmSheet
        visible={confirmOpen}
        title={COPY.restore.title}
        message={restoreQuestion(
          { rituals: chosen?.rituals.length ?? 0, tasks: chosen?.tasks.length ?? 0 },
          exportedOn,
          { rituals: rituals.length, tasks: tasks.length }
        )}
        cancelLabel={COPY.restore.keep}
        confirmLabel={COPY.restore.replace}
        confirmIcon={Upload}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleRestore}
      />
    </SafeAreaView>
  );
}
