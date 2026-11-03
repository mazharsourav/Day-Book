import { useRituals } from '@/context/DataContext';
import { useToday } from '@/hooks/useToday';
import {
  applyReminders,
  askPermission,
  readPermission,
  REMINDERS_SUPPORTED,
} from '@/utils/reminderNotifications';
import { planAll, SentRecords, stillWorthSending } from '@/utils/reminderPlan';
import {
  DEFAULT_REMINDERS,
  parseReminderSettings,
  PermissionState,
  permissionState,
  ReminderKind,
  ReminderSettings,
  reminderSettingsText,
  ReminderTime,
  switchOnStep,
  withSlot,
} from '@/utils/reminderSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

// Preferences, kept apart from the rituals and not part of a backup (like light and dark).
// The key is 1.0.0's, so its `{ enabled }` is read and moved to the new shape in place.
const SETTINGS_KEY = 'daybook:reminder';
const SENT_KEY = 'daybook:reminder-sent';

// TEMPORARY (Mazhar, 2026-11-03): "never sends a note twice" is off while reminders are tested, so a
// reminder can be set again and again on the same day. Set back to true after testing.
export const ONCE_A_DAY = false;

interface ReminderContextValue {
  // False in a browser and in Expo Go, where there are no phone notifications.
  supported: boolean;
  settings: ReminderSettings;
  permission: PermissionState;
  setTime: (kind: ReminderKind, time: ReminderTime) => void;
  // 'explain-first' means the switch stays off until the sheet "Allow reminders?" is answered.
  setOn: (kind: ReminderKind, on: boolean) => 'done' | 'explain-first';
  // After "Continue": Android asks, then the reminder is on whatever the answer. If the answer was
  // Don't allow, the blocked box shows the way to the phone's settings.
  allowAndTurnOn: (kind: ReminderKind) => Promise<void>;
  // TEMPORARY (Expo Go reminder test): forget today's "already sent" notes and plan again.
  resetSentForTest: () => Promise<void>;
}

const ReminderContext = createContext<ReminderContextValue | null>(null);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const { rituals, tasks, canSave } = useRituals();
  const today = useToday();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [loaded, setLoaded] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('not-asked');
  // Goes up each time the app comes back to the front, so the 14 and 30 day plans are made again.
  const [opened, setOpened] = useState(0);

  // Load the saved switches and times once.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (!cancelled) setSettings(parseReminderSettings(raw));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the permission and the plan fresh, since both can change while the app is away.
  useEffect(() => {
    if (!REMINDERS_SUPPORTED) return;
    const refresh = () => {
      readPermission()
        .then((p) => setPermission(permissionState(p)))
        .catch(() => {});
    };
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
        setOpened((n) => n + 1);
      }
    });
    return () => sub.remove();
  }, []);

  // Plan again whenever rituals, tasks, the day, the settings change, or the app opens.
  // Not while saved data can't be read: the empty lists would cancel every reminder.
  useEffect(() => {
    if (!loaded || !REMINDERS_SUPPORTED || !canSave) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        const raw = ONCE_A_DAY ? await AsyncStorage.getItem(SENT_KEY) : null;
        const sent: SentRecords = raw ? JSON.parse(raw) : {};
        const next = planAll(settings, rituals, tasks, new Date(), sent);
        if (cancelled) return;
        await applyReminders(next.plan, (note) => stillWorthSending(note, settings, rituals, tasks));
        await AsyncStorage.setItem(SENT_KEY, JSON.stringify(next.sent));
      } catch {
        // Planning runs again on the next change or open.
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [loaded, canSave, settings, rituals, tasks, today, opened]);

  const save = useCallback((update: (s: ReminderSettings) => ReminderSettings) => {
    setSettings((s) => {
      const next = update(s);
      AsyncStorage.setItem(SETTINGS_KEY, reminderSettingsText(next)).catch(() => {});
      return next;
    });
  }, []);

  const setTime = useCallback(
    (kind: ReminderKind, time: ReminderTime) => save((s) => withSlot(s, kind, { hour: time.hour, minute: time.minute })),
    [save]
  );

  const setOn = useCallback(
    (kind: ReminderKind, on: boolean) => {
      if (on && switchOnStep(permission) === 'explain-first') return 'explain-first' as const;
      save((s) => withSlot(s, kind, { on }));
      return 'done' as const;
    },
    [permission, save]
  );

  const allowAndTurnOn = useCallback(
    async (kind: ReminderKind) => {
      try {
        setPermission(permissionState(await askPermission()));
      } catch {
        // The switch still goes on; the box shows if notifications stay off.
      }
      save((s) => withSlot(s, kind, { on: true }));
    },
    [save]
  );

  const resetSentForTest = useCallback(async () => {
    await AsyncStorage.removeItem(SENT_KEY);
    setOpened((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ supported: REMINDERS_SUPPORTED, settings, permission, setTime, setOn, allowAndTurnOn, resetSentForTest }),
    [settings, permission, setTime, setOn, allowAndTurnOn, resetSentForTest]
  );

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}

export function useReminder(): ReminderContextValue {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error('useReminder must be used within ReminderProvider');
  return ctx;
}
