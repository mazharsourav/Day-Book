import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import type { PlannedReminder } from './reminderPlan';
import type { PhonePermission } from './reminderSettings';
import { diffSchedule, NoteData, noteData } from './scheduleDiff';

// Expo Go on Android throws as soon as expo-notifications is loaded, which would stop the app, so
// there reminders are off (Settings says "Reminders work in the installed app"). A preview or release
// build always has them.
const Notifications: typeof NotificationsModule | null = isRunningInExpoGo()
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo-notifications');

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

async function ensureChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android' || channelReady) return;
  // On Android 13 and newer the permission question only appears once a channel exists.
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  await Notifications.deleteNotificationChannelAsync(OLD_CHANNEL_ID);
  channelReady = true;
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

// Makes the phone's waiting notes match `plan`: cancels the ones that are no longer right and adds
// the missing ones. A note that is due but not shown yet is kept while `stillWanted` says it still
// has something to say (see diffSchedule). Each note carries its kind and day, so a tap knows where to go.
export function applyReminders(plan: PlannedReminder[], stillWanted: (note: NoteData) => boolean): Promise<void> {
  return enqueue(async () => {
    if (!Notifications) return;
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
          channelId: CHANNEL_ID,
        },
      });
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
