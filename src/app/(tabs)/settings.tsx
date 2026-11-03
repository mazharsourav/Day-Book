import { ConfirmSheet } from '@/components/ConfirmSheet';
import { BlockedBox, PermissionSheet, TimeSheet } from '@/components/ReminderSheets';
import { StorageNotice } from '@/components/StorageNotice';
import { AppText } from '@/components/ui/AppText';
import { Group, GroupFoot, GroupRow, GroupTitle } from '@/components/ui/Group';
import { Panes, tabScreenEdges } from '@/components/ui/Panes';
import { ScreenTitle } from '@/components/ui/ScreenParts';
import { Segmented } from '@/components/ui/Segmented';
import { COPY, lastBackupLine, restoreQuestion, restoreSummary } from '@/constants/copy';
import { LAYOUT, TABLET } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { TYPE } from '@/constants/type';
import { EASE } from '@/constants/easing';
import { AppearancePreference, useAppearance } from '@/context/AppearanceContext';
import { useRituals } from '@/context/DataContext';
import { useReminder } from '@/context/ReminderContext';
import { useColors } from '@/hooks/useColors';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { useUses24Hour } from '@/hooks/useUses24Hour';
import { Ritual, Task } from '@/types';
import { backupFileName, buildBackup, parseBackup } from '@/utils/backup';
import { exportBackupFile, pickBackupText } from '@/utils/backupFiles';
import { haptic, setHapticsOn, useHapticsOn } from '@/utils/haptics';
import { longDate, readLastBackup, saveLastBackup } from '@/utils/lastBackup';
import { openPhoneSettings } from '@/utils/reminderNotifications';
import { reminderText } from '@/utils/reminderPlan';
import { ReminderKind, showBlockedBox } from '@/utils/reminderSettings';
import { timeLabel } from '@/utils/timeFormat';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Bell, CalendarCheck, ChevronRight, Download, Info, SunMoon, Upload, Vibrate, type LucideIcon } from 'lucide-react-native';
import { Fragment, ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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

type SectionKey = 'reminders' | 'appearance' | 'feel' | 'backup' | 'about';

const SECTIONS: { key: SectionKey; label: string; icon: LucideIcon }[] = [
  { key: 'reminders', label: COPY.settings.reminders, icon: Bell },
  { key: 'appearance', label: COPY.settings.appearance, icon: SunMoon },
  { key: 'feel', label: COPY.settings.feel, icon: Vibrate },
  { key: 'backup', label: COPY.settings.backup, icon: Download },
  { key: 'about', label: COPY.settings.about, icon: Info },
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
  const mode = useLayoutMode();
  const [section, setSection] = useState<SectionKey>('reminders');

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

  // Each section's rows. A phone shows them one after another; a tablet shows the chosen one
  // beside the list of sections (frame G).
  const sections: Record<SectionKey, ReactNode> = {
    reminders: (
      <>
        {reminder.supported && showBlockedBox(reminder.permission, settings) && (
          <BlockedBox onOpenSettings={() => openPhoneSettings().catch(() => {})} />
        )}
        <Group>{[...reminderRows('evening'), ...reminderRows('morning')]}</Group>
        <GroupFoot>{reminder.supported ? COPY.settings.remindersFoot : COPY.settings.remindersUnsupported}</GroupFoot>
      </>
    ),
    appearance: <Segmented options={APPEARANCE} value={preference} onChange={setPreference} />,
    feel: (
      <>
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
      </>
    ),
    backup: (
      <>
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
      </>
    ),
    about: (
      <>
        <Group>
          <GroupRow label={COPY.settings.howItWorks} onPress={() => router.push('/how-it-works')} />
          <GroupRow label={COPY.settings.version} value={Constants.expoConfig?.version ?? ''} chevron={false} />
        </Group>
        <GroupFoot>{COPY.settings.aboutFoot}</GroupFoot>
      </>
    ),
  };

  const tablet = mode !== 'phone';
  const page = tablet ? (
    <Panes
      leftWidth={TABLET.settingsList}
      left={
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <ScreenTitle title={COPY.settings.title} />
          <View style={{ paddingTop: 14, paddingHorizontal: 12, gap: 4 }}>
            {SECTIONS.map((s) => (
              <SectionItem key={s.key} label={s.label} icon={s.icon} on={s.key === section} onPress={() => setSection(s.key)} />
            ))}
          </View>
        </ScrollView>
      }
      right={
        <Animated.View key={section} entering={FadeIn.duration(MOTION.dayListFade).easing(EASE)} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: LAYOUT.screenPadding, paddingTop: 10, paddingBottom: 14 }}>
              <AppText accessibilityRole="header" style={[TYPE.screenTitle, { fontSize: 28, lineHeight: 34, letterSpacing: -0.7 }]}>
                {SECTIONS.find((s) => s.key === section)?.label}
              </AppText>
            </View>
            {sections[section]}
            {section === 'reminders' && reminder.supported && <LockScreenPreview time={timeLabel(settings.evening, uses24)} />}
          </ScrollView>
        </Animated.View>
      }
    />
  ) : (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <ScreenTitle title={COPY.settings.title} />
      {SECTIONS.map((s) => (
        <Fragment key={s.key}>
          <GroupTitle>{s.label}</GroupTitle>
          {sections[s.key]}
        </Fragment>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView edges={tabScreenEdges(mode)} style={{ flex: 1, backgroundColor: c.ground }}>
      <StorageNotice />
      {page}

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

// A section in the tablet list (frame G): its icon, its name and a chevron; the chosen one on a grey pill.
function SectionItem({ label, icon: Icon, on, onPress }: { label: string; icon: LucideIcon; on: boolean; onPress: () => void }) {
  const c = useColors();
  const color = on ? c.text : c.muted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: TABLET.sideItemHeight,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: on ? c.surface : 'transparent',
      }}
    >
      <Icon size={22} color={color} strokeWidth={on ? 2.25 : 1.75} />
      <AppText style={{ flex: 1, fontSize: 17, lineHeight: 21, fontWeight: '600', color }}>{label}</AppText>
      <View style={{ opacity: 0.6 }}>
        <ChevronRight size={18} color={color} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

// Tablets, under the reminders (frame G): what a ritual reminder looks like on the lock screen.
// Sample counts, the same as in "Allow reminders?"; the time is the person's own.
const SAMPLE = reminderText(2, 5, 12);

function LockScreenPreview({ time }: { time: string }) {
  const c = useColors();
  return (
    <View accessible accessibilityLabel={`${COPY.settings.onLockScreen}: ${SAMPLE.title} ${SAMPLE.body}`}>
      <AppText style={[TYPE.label, { color: c.muted, paddingTop: 24, paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 8 }]}>
        {COPY.settings.onLockScreen}
      </AppText>
      <View style={{ marginHorizontal: LAYOUT.screenPadding, backgroundColor: c.surface, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
            <CalendarCheck size={11} color={c.onAccent} strokeWidth={2.5} />
          </View>
          <AppText style={{ fontSize: 12, lineHeight: 16, fontWeight: '700' }}>{COPY.common.appName}</AppText>
          <AppText style={[TYPE.tiny, { color: c.muted, fontWeight: '500' }]}>· {time}</AppText>
        </View>
        <AppText style={{ fontSize: 15, lineHeight: 20, fontWeight: '700', marginTop: 4 }}>{SAMPLE.title}</AppText>
        <AppText style={{ fontSize: 14, lineHeight: 19, fontWeight: '500', color: c.muted }}>{SAMPLE.body}</AppText>
      </View>
    </View>
  );
}
