import { useRituals } from '@/context/RitualContext';
import { useToday } from '@/hooks/useToday';
import {
  applyReminders,
  cancelReminders,
  ensureReminderPermission,
  hasReminderPermission,
  REMINDERS_SUPPORTED,
  sendTestReminder,
} from '@/utils/reminderNotifications';
import { planReminders } from '@/utils/reminderPlan';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';

// A preference, kept apart from the rituals and not part of a backup (like light and dark).
const STORAGE_KEY = 'daybook:reminder';

type Permission = 'unknown' | 'granted' | 'denied';

interface ReminderContextValue {
  // False in a browser, where there are no phone notifications.
  supported: boolean;
  enabled: boolean;
  permission: Permission;
  setEnabled: (on: boolean) => Promise<'ok' | 'denied'>;
  sendTest: () => Promise<'ok' | 'denied'>;
}

const ReminderContext = createContext<ReminderContextValue | null>(null);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const { rituals } = useRituals();
  const today = useToday();
  const [enabled, setEnabledState] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [permission, setPermission] = useState<Permission>('unknown');

  // Load the saved switch once.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || raw === null) return;
        const saved = JSON.parse(raw);
        setEnabledState(saved?.enabled === true);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the permission up to date, since it can change in the phone's settings.
  useEffect(() => {
    if (!REMINDERS_SUPPORTED) return;
    const refresh = () => {
      hasReminderPermission()
        .then((granted) => setPermission(granted ? 'granted' : 'denied'))
        .catch(() => {});
    };
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, []);

  // Plan again whenever the rituals, the day or the switch change.
  useEffect(() => {
    if (!loaded || !REMINDERS_SUPPORTED) return;
    if (!enabled) {
      cancelReminders().catch(() => {});
      return;
    }
    const id = setTimeout(() => {
      applyReminders(planReminders(rituals, new Date())).catch(() => {});
    }, 400);
    return () => clearTimeout(id);
  }, [loaded, enabled, rituals, today]);

  const setEnabled = useCallback(async (on: boolean) => {
    if (on) {
      const result = await ensureReminderPermission();
      setPermission(result);
      if (result === 'denied') return 'denied' as const;
    }
    setEnabledState(on);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: on })).catch(() => {});
    return 'ok' as const;
  }, []);

  const sendTest = useCallback(async () => {
    const result = await ensureReminderPermission();
    setPermission(result);
    if (result === 'denied') return 'denied' as const;
    await sendTestReminder();
    return 'ok' as const;
  }, []);

  const value = useMemo(
    () => ({ supported: REMINDERS_SUPPORTED, enabled, permission, setEnabled, sendTest }),
    [enabled, permission, setEnabled, sendTest]
  );

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}

export function useReminder(): ReminderContextValue {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error('useReminder must be used within ReminderProvider');
  return ctx;
}
