// Every sentence the app shows, copied from the design board. Change the board first, then this file.
// copy.test.ts locks the wording.

export const COPY = {
  common: {
    readOnly: 'Read only',
    done: 'Done',
    cancel: 'Cancel',
    save: 'Save',
    add: 'Add',
    edit: 'Edit',
    today: 'Today',
    yesterday: 'Yesterday',
  },
  today: {
    firstRunTitle: 'Add your first ritual',
    firstRunBody:
      "A ritual is one small thing you do each day. Press its circle when it's done, and watch the month fill in.",
    newRitual: 'New ritual',
    allDoneNote: 'Nothing left for today.\nSee you tomorrow.',
    olderDayHint: 'Only yesterday can still be changed.',
    readOnlySuffix: ' · Read only',
  },
  ritual: {
    changeRule: 'You can change today and yesterday. Older days are a record.',
    thisWeek: 'This week',
    note: 'Note',
    markDone: 'Mark as done',
    doneToday: 'Done for today',
    noStreak: 'No streak yet',
    newTitle: 'New ritual',
    editTitle: 'Edit ritual',
    nameLabel: 'Name',
    noteLabel: 'Note (optional)',
    notePlaceholder: 'Why you do it, or anything to remember',
    namePlaceholder: 'Morning tea',
    iconLabel: 'Icon',
    deleteRitual: 'Delete ritual',
    deleteBody: "Its history will be removed too. This can't be undone.",
    keepIt: 'Keep it',
    notFoundTitle: 'Ritual not found',
    notFoundBody: 'It may have been deleted.',
    goBack: 'Go back',
  },
  history: {
    title: 'History',
    // History is only for reading (Mazhar, 3 November 2026). Not on the board yet.
    readOnlyHint: 'You can change today and yesterday on Today.',
    legendAll: 'All done',
    legendSome: 'Some',
    legendNone: 'None',
    noRitualsTitle: 'No rituals yet.',
    noRitualsBody: 'Add one on Today to start filling the month.',
  },
  share: {
    title: 'Share month',
    close: 'Close',
    look: 'Look',
    light: 'Light',
    dark: 'Dark',
    note: 'Made on your phone. It shows the dots and the month, never your ritual names or notes.',
    shareImage: 'Share image',
    failed: "Couldn't create the picture. Try again.",
    unavailable: "Sharing isn't available on this device.",
  },
  week: {
    title: 'Week',
    titleLabel: 'Title',
    titlePlaceholder: 'What needs doing?',
    dayLabel: 'Day',
    addTask: 'Add task',
    editTask: 'Edit task',
    deleteTask: 'Delete task',
    moveHint: 'Press and hold a task to move it to another day.',
    doneCannotMove: 'Done tasks cannot be moved',
    pastDayPill: 'Past day, read only',
    holdForNextWeek: 'Hold for next week',
    // Not on the board, which only draws the next-week arrow.
    holdForPreviousWeek: 'Hold for previous week',
    // Screen-reader actions on a task (board card "Reading aloud").
    moveAction: 'Move to another day',
    deleteAction: 'Delete',
    emptyDayTitle: 'Nothing planned',
  },
  undo: {
    action: 'Undo',
    taskDeleted: 'Task deleted',
  },
  settings: {
    title: 'Settings',
    reminders: 'Reminders',
    appearance: 'Appearance',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    feel: 'Feel',
    haptics: 'Haptics',
    hapticsFoot: 'Small taps when you tick, move a task or save.',
    backup: 'Backup',
    about: 'About',
    // Not on the board: Expo Go and a browser cannot send notifications.
    remindersUnsupported: 'Reminders work in the installed app.',
    remindersFoot: 'Sent only when there is something to say, and always with a count, never a task name.',
    // Mazhar, 3 November 2026: no time of day in the names (the board said "Evening ritual reminder"
    // and "Morning task note"), since either can be set to any time.
    ritualReminder: 'Ritual reminder',
    taskReminder: 'Task reminder',
    eveningSub: 'Sent only if rituals are still open.',
    morningSub: 'Sent only on days that have tasks.',
    time: 'Time',
    blocked: "Notifications are off for Day Book. Turn them on in your phone's settings.",
    openPhoneSettings: 'Open phone settings',
    saveBackup: 'Save a backup',
    restoreBackup: 'Restore from a backup file',
    howItWorks: 'How Day Book works',
    version: 'Version',
    aboutFoot: 'Everything stays on your phone. There is no account, and nothing is sent anywhere.',
  },
  permission: {
    title: 'Allow reminders?',
    body: 'Day Book will ask your phone for permission to send notifications. They only carry counts, like “2 of your 5 rituals are still open today”, never the names of your tasks.',
    continue: 'Continue',
    notNow: 'Not now',
  },
  notices: {
    saveFailed: "Couldn't save your latest changes.",
    tryAgain: 'Try again',
    newer: 'Your data was saved by a newer Day Book. Update the app to open it. Changes are not saved.',
    readFailed: "Couldn't open your saved data. Changes are not saved. Close and reopen the app.",
    unreadable: "Your saved data couldn't be read, so Day Book started empty. A copy was kept.",
    ok: 'OK',
  },
  restore: {
    title: 'Replace your data?',
    keep: 'Keep current data',
    replace: 'Replace with backup',
    badFile: 'That isn’t a Day Book backup file. Choose a file saved by Day Book.',
    offWhileUnreadable: 'Restore is off until your saved data can be read again.',
    newerFile: 'That backup is from a newer version of Day Book. Update the app, then try again.',
    saveFailed: 'Couldn’t create the backup file. Try again.',
    sharingUnavailable: 'Sharing isn’t available on this device.',
    // From 1.0.0, not on the board: a file that is not text, or cannot be opened at all.
    unreadableFile: "That file can't be read as a backup. Choose a file saved by Day Book.",
    openFailed: "Couldn't read that file. Try another one.",
    unknownDate: 'an unknown date',
  },
  how: {
    title: 'How Day Book works',
    back: 'Settings',
    lead: 'Two kinds of things live here. Rituals are what you do every day. Tasks belong to one day only.',
    sections: [
      {
        title: 'Rituals',
        body: "Small things you do every day. Press the circle when it's done. Your streak counts the days in a row.",
      },
      {
        title: 'Fixing a day',
        body: 'Forgot to tick something? You can still change yesterday. Older days are kept as a record you can look at but not change.',
      },
      {
        title: 'Week',
        body: 'Tasks for one day. Open Week, pick a day and tap Add task. Tick a task on its day, or earlier if you did it early. Press and hold a task to move it to another day. Past days and earlier weeks are a record you can look at.',
      },
      {
        title: 'History',
        body: 'Every day on a calendar. A filled circle means you did every ritual that day.',
      },
      {
        title: 'Reminders',
        body: 'A ritual reminder if rituals are still open, and a task reminder with how many tasks you have that day. Both are off until you turn them on in Settings, where you also set the times. The words show on the lock screen, with a count and never a task name.',
      },
      {
        title: 'Your data',
        body: "Everything stays on your phone. There is no account. Save a backup from Settings now and then, so a lost phone doesn't take your days with it.",
      },
    ],
    sampleRituals: [
      { name: 'Morning tea', meta: '12 day streak', icon: 'cup', done: true },
      { name: 'Read', meta: 'Start a streak today', icon: 'book', done: false },
    ],
    olderDays: 'Older days',
    lookOnly: 'Look only',
    canChange: 'Can change',
    sampleTasks: [
      { title: 'Buy groceries', done: true },
      { title: 'Call the plumber', done: false },
    ],
    rituals: 'Rituals',
    tasks: 'Tasks',
  },
} as const;

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayAndNumber = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return `${WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()]} ${d}`;
};

// The pill while a task is carried over a day ("Move to Thursday 12").
export function moveToLine(date: string): string {
  return `Move to ${dayAndNumber(date)}`;
}

// The note after a move ("Moved to Thursday 12. Undo").
export function movedToLine(date: string): string {
  return `Moved to ${dayAndNumber(date)}`;
}

// Under the Backup buttons in Settings ("Last backup: never" before the first one).
export function lastBackupLine(date: string | null): string {
  return `Last backup: ${date ?? 'never'}. A backup is one file with every ritual, its history, its note and your tasks. Send it to Drive or email it to yourself.`;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// The left side of the progress bar on Today.
export function progressText(done: number, total: number): string {
  return total > 0 && done === total ? `All ${total} done` : `${done} of ${total} done`;
}

// The right side, shown only on today while something is still open.
export function progressLeft(done: number, total: number, isToday: boolean): string {
  const left = total - done;
  return isToday && left > 0 ? `${left} left` : '';
}

// Under a ritual name in a list.
export function streakLine(streak: number): string {
  return streak > 0 ? `${streak} day streak` : 'Start a streak today';
}

// The question before a ritual and its history are deleted.
export function deleteRitualTitle(name: string): string {
  return `Delete “${name}”?`;
}

// Under the month name on History ("101 doses done").
export function monthDosesLine(doses: number): string {
  return `${plural(doses, 'dose', 'doses')} done`;
}

// A ritual's total for the month on History ("21 days").
export function daysLine(days: number): string {
  return plural(days, 'day', 'days');
}

// Under "Nothing planned" on an empty day that is not past.
export function emptyDayBody(weekday: string): string {
  return `Tap Add task to plan ${weekday}.`;
}

// Under a day title in a sheet ("3 of 5 done").
export function dayCountLine(done: number, total: number): string {
  return `${done} of ${total} done`;
}

// Under a day title on Week ("4 tasks, 2 done").
export function taskCountLine(count: number, done: number): string {
  if (count === 0) return 'No tasks';
  return done > 0 ? `${plural(count, 'task', 'tasks')}, ${done} done` : plural(count, 'task', 'tasks');
}

const ritualsCount = (n: number) => plural(n, 'ritual', 'rituals');
const tasksCount = (n: number) => (n === 0 ? 'no tasks' : plural(n, 'task', 'tasks'));

// The question before a backup replaces everything: what the file holds and what Day Book holds now.
export function restoreQuestion(
  backup: { rituals: number; tasks: number },
  savedOn: string,
  now: { rituals: number; tasks: number }
): string {
  return (
    `This backup has ${ritualsCount(backup.rituals)} and ${tasksCount(backup.tasks)}, saved on ${savedOn}. ` +
    `Day Book has ${ritualsCount(now.rituals)} and ${tasksCount(now.tasks)} now. Restoring replaces them.`
  );
}

// The line after a restore. Damaged entries in the file are skipped and counted.
export function restoreSummary(rituals: number, tasks: number, dropped: number): string {
  const skipped =
    dropped > 0 ? ` ${dropped} damaged ${dropped === 1 ? 'entry was' : 'entries were'} skipped.` : '';
  return `Restored ${ritualsCount(rituals)} and ${tasksCount(tasks)}.${skipped}`;
}

// The morning note. A count only, never a task title.
export function morningNote(count: number): { title: string; body: string } {
  return {
    title: `You have ${plural(count, 'task', 'tasks')} today`,
    body: count === 1 ? 'Open Day Book to see it.' : 'Open Day Book to see them.',
  };
}
