import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import type { PlannedReminder } from './reminderPlan';
import type { PhonePermission } from './reminderSettings';
import { diffSchedule, NoteData, noteData } from './scheduleDiff';

// Expo Go on Android throws as soon as the whole expo-notifications package is loaded, which would
// stop the app. A preview or release build always has reminders.
// TEMPORARY (Mazhar, 2026-11-03): to test reminders in Expo Go, only the parts Day Book uses are
// loaded there (see expoGoNotifications.ts). Set to false, or remove, before the release.
const EXPO_GO_TEST = true;

function loadNotifications(): typeof NotificationsModule | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  if (!isRunningInExpoGo()) return require('expo-notifications');
  if (!EXPO_GO_TEST) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./expoGoNotifications').default;
  } catch {
    // If Expo Go still refuses, reminders stay off there and the app carries on.
    return null;
  }
}

const Notifications = loadNotifications();

export const REMINDERS_SUPPORTED = Notifications !== null;

// One channel for both reminders, shown on the lock screen with its words (they only carry counts).
// 1.0.0 made the channel "reminders" without that, and Android never lets a channel's lock-screen
// setting change after it is made, so the old one is deleted and a new one is made.
const CHANNEL_ID = 'daybook-reminders';
const OLD_CHANNEL_ID = 'reminders';

// A notification that arrives while the app is open is still shown, quietly.
Notifications?.setNotificationHandler({
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

let channelReady = false;
// TEMPORARY (Expo Go reminder test): Expo Go refuses to make channels (its channel manager is missing),
// so there notes go to Expo Go's own channel instead. Builds always make Day Book's channel.
let useExpoGoChannel = false;

async function ensureChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android' || channelReady || useExpoGoChannel) return;
  try {
    // On Android 13 and newer the permission question only appears once a channel exists.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await Notifications.deleteNotificationChannelAsync(OLD_CHANNEL_ID);
    channelReady = true;
  } catch (e) {
    if (!(EXPO_GO_TEST && isRunningInExpoGo())) throw e;
    useExpoGoChannel = true;
  }
}

// What the phone allows right now. Never shows a question.
export async function readPermission(): Promise<PhonePermission> {
  if (!Notifications) return { status: 'denied', canAskAgain: false };
  const p = await Notifications.getPermissionsAsync();
  return { status: p.granted ? 'granted' : p.status === 'denied' ? 'denied' : 'undetermined', canAskAgain: p.canAskAgain };
}

// Android's own question (frame 39). Asked only after the app's sheet explained what is coming.
export async function askPermission(): Promise<PhonePermission> {
  if (!Notifications) return { status: 'denied', canAskAgain: false };
  await ensureChannel();
  const current = await readPermission();
  if (current.status === 'granted' || !current.canAskAgain) return current;
  await Notifications.requestPermissionsAsync();
  return readPermission();
}

// TEMPORARY (Expo Go reminder test): what was last handed to the phone, shown in Settings while testing.
export interface ReminderTestInfo {
  plannedAt: Date;
  planned: PlannedReminder[];
  // How many notes the phone itself says are waiting, or null if it could not be asked.
  scheduled: number | null;
  error: string | null;
}
let testInfo: ReminderTestInfo | null = null;
export function getReminderTestInfo(): ReminderTestInfo | null {
  return testInfo;
}

// Every note planned for today since the app started, and when it was planned, so one that is later
// dropped from the plan (its time passed, or nothing was left to say) can still be traced.
export interface PlannedTodayEntry {
  kind: PlannedReminder['kind'];
  at: Date;
  plannedAt: Date;
}
const plannedToday: PlannedTodayEntry[] = [];
export function getPlannedToday(): PlannedTodayEntry[] {
  return plannedToday;
}
function notePlannedToday(plan: PlannedReminder[]) {
  const today = new Date().toDateString();
  for (const p of plan) {
    if (p.date.toDateString() !== today) continue;
    if (plannedToday.some((e) => e.kind === p.kind && e.at.getTime() === p.date.getTime())) continue;
    plannedToday.push({ kind: p.kind, at: p.date, plannedAt: new Date() });
  }
}

// Makes the phone's waiting notes match `plan`: cancels the ones that are no longer right and adds
// the missing ones. A note that is due but not shown yet is kept while `stillWanted` says it still
// has something to say (see diffSchedule). Each note carries its kind and day, so a tap knows where to go.
export function applyReminders(plan: PlannedReminder[], stillWanted: (note: NoteData) => boolean): Promise<void> {
  return enqueue(async () => {
    if (!Notifications) return;
    testInfo = { plannedAt: new Date(), planned: plan, scheduled: null, error: null };
    notePlannedToday(plan);
    try {
      await ensureChannel();
      const waiting = await Notifications.getAllScheduledNotificationsAsync();
      const { cancel, add } = diffSchedule(
        waiting.map((r) => ({ id: r.identifier, title: r.content.title, body: r.content.body, data: r.content.data })),
        plan,
        new Date(),
        stillWanted
      );
      for (const id of cancel) await Notifications.cancelScheduledNotificationAsync(id);
      for (const reminder of add) {
        await Notifications.scheduleNotificationAsync({
          content: { title: reminder.title, body: reminder.body, data: { ...noteData(reminder) } },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminder.date,
            channelId: useExpoGoChannel ? undefined : CHANNEL_ID,
          },
        });
      }
      testInfo.scheduled = (await Notifications.getAllScheduledNotificationsAsync()).length;
    } catch (e) {
      testInfo.error = e instanceof Error ? e.message : String(e);
      throw e;
    }
  });
}

// Calls `onTap` with the tapped note's data: once for a tap that opened the app, then for every
// tap while it runs. Returns a function that stops listening.
export function listenForTaps(onTap: (data: unknown) => void): () => void {
  if (!Notifications) return () => {};
  const handle = (response: NotificationsModule.NotificationResponse | null) => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    onTap(response.notification.request.content.data);
    Notifications.clearLastNotificationResponse();
  };
  handle(Notifications.getLastNotificationResponse());
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}

export function openPhoneSettings(): Promise<void> {
  return Linking.openSettings();
}
