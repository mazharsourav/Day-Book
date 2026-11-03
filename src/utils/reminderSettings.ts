// The two reminders' switches and times, and the rules for asking the phone's permission.
// Kept apart from the rituals and not part of a backup (like light and dark).

export type ReminderKind = 'evening' | 'morning';

export interface ReminderTime {
  hour: number;
  minute: number;
}

export interface ReminderSlot extends ReminderTime {
  on: boolean;
}

export type ReminderSettings = Record<ReminderKind, ReminderSlot>;

// Both off until switched on: the evening one at 8:00 PM, the morning one at 8:00 AM.
export const DEFAULT_REMINDERS: ReminderSettings = {
  evening: { on: false, hour: 20, minute: 0 },
  morning: { on: false, hour: 8, minute: 0 },
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isWhole = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

function readSlot(input: unknown, fallback: ReminderSlot): ReminderSlot {
  if (!isObject(input)) return fallback;
  const timeOk = isWhole(input.hour, 0, 23) && isWhole(input.minute, 0, 59);
  return {
    on: input.on === true,
    hour: timeOk ? (input.hour as number) : fallback.hour,
    minute: timeOk ? (input.minute as number) : fallback.minute,
  };
}

// Reads the saved text. 1.0.0 saved `{ enabled }` for its one 8 PM reminder: if it was on,
// it becomes the evening reminder at 8:00 PM, so nobody loses a reminder in the update.
export function parseReminderSettings(raw: string | null): ReminderSettings {
  if (raw === null) return DEFAULT_REMINDERS;
  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    return DEFAULT_REMINDERS;
  }
  if (!isObject(saved)) return DEFAULT_REMINDERS;
  if (saved.version === undefined && 'enabled' in saved) {
    return withSlot(DEFAULT_REMINDERS, 'evening', { on: saved.enabled === true });
  }
  return {
    evening: readSlot(saved.evening, DEFAULT_REMINDERS.evening),
    morning: readSlot(saved.morning, DEFAULT_REMINDERS.morning),
  };
}

export function reminderSettingsText(settings: ReminderSettings): string {
  return JSON.stringify({ version: 2, evening: settings.evening, morning: settings.morning });
}

export function withSlot(settings: ReminderSettings, kind: ReminderKind, change: Partial<ReminderSlot>): ReminderSettings {
  return { ...settings, [kind]: { ...settings[kind], ...change } };
}

// What the phone says about notifications, as Expo reports it.
export interface PhonePermission {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
}

// not-asked: the phone has not asked yet. denied: the answer was Don't allow, but it can ask again.
// blocked: the phone will not ask again; only its own settings can turn notifications on.
export type PermissionState = 'granted' | 'not-asked' | 'denied' | 'blocked';

export function permissionState(p: PhonePermission): PermissionState {
  if (p.status === 'granted') return 'granted';
  if (!p.canAskAgain) return 'blocked';
  return p.status === 'denied' ? 'denied' : 'not-asked';
}

// Switching a reminder on. When the phone can still ask, the sheet "Allow reminders?" explains
// first (frame 38), then Android asks (frame 39). Otherwise the switch simply goes on; if the phone
// blocks notifications, the box at the top of Settings shows the way out (frame 37).
export function switchOnStep(permission: PermissionState): 'turn-on' | 'explain-first' {
  return permission === 'not-asked' || permission === 'denied' ? 'explain-first' : 'turn-on';
}

// The box "Notifications are off for Day Book" shows while a reminder is on but cannot arrive.
export function showBlockedBox(permission: PermissionState, settings: ReminderSettings): boolean {
  const anyOn = settings.evening.on || settings.morning.on;
  return anyOn && (permission === 'denied' || permission === 'blocked');
}
