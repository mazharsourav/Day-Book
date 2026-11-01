import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import type { PlannedReminder } from './reminderPlan';

export const REMINDERS_SUPPORTED = true;
export type PermissionResult = 'granted' | 'denied';

const CHANNEL_ID = 'reminders';

// A notification that arrives while the app is open is still shown, quietly.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Scheduling calls run one after another, so quick changes cannot interleave.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const next = queue.then(job, job);
  queue = next.catch(() => {});
  return next;
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // On Android 13 and newer the permission prompt only appears once a channel exists.
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Whether notifications are allowed right now. Never shows a prompt.
export async function hasReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

// Asks the person to allow notifications, if they have not decided yet.
export async function ensureReminderPermission(): Promise<PermissionResult> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted ? 'granted' : 'denied';
}

// Replaces everything scheduled with `plan`.
export function applyReminders(plan: PlannedReminder[]): Promise<void> {
  return enqueue(async () => {
    await ensureChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const reminder of plan) {
      await Notifications.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.date,
          channelId: CHANNEL_ID,
        },
      });
    }
  });
}

export function cancelReminders(): Promise<void> {
  return enqueue(() => Notifications.cancelAllScheduledNotificationsAsync());
}

// A reminder that arrives in about 10 seconds, to check that notifications work.
export function sendTestReminder(): Promise<void> {
  return enqueue(async () => {
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Test reminder', body: 'Day Book reminders are working.' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
        channelId: CHANNEL_ID,
      },
    });
  });
}

export function openPhoneSettings(): Promise<void> {
  return Linking.openSettings();
}
