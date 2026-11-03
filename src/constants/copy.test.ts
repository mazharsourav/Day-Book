/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  COPY,
  dayCountLine,
  daysLine,
  deleteRitualTitle,
  lastBackupLine,
  monthDosesLine,
  morningNote,
  movedToLine,
  moveToLine,
  progressLeft,
  progressText,
  streakLine,
  taskCountLine,
} from './copy';

// Wording copied from the design board. A change here must be a change on the board first.
test('fixed sentences are the board wording', () => {
  assert.equal(COPY.today.firstRunTitle, 'Add your first ritual');
  assert.equal(
    COPY.today.firstRunBody,
    "A ritual is one small thing you do each day. Press its circle when it's done, and watch the month fill in."
  );
  assert.equal(COPY.today.allDoneNote, 'Nothing left for today.\nSee you tomorrow.');
  assert.equal(COPY.today.olderDayHint, 'Only yesterday can still be changed.');
  assert.equal(COPY.ritual.changeRule, 'You can change today and yesterday. Older days are a record.');
  assert.equal(COPY.ritual.markDone, 'Mark as done');
  assert.equal(COPY.ritual.doneToday, 'Done for today');
  assert.equal(COPY.history.readOnlyHint, 'You can change today and yesterday on Today.');
  assert.equal(COPY.week.moveHint, 'Press and hold a task to move it to another day.');
  assert.equal(COPY.week.doneCannotMove, 'Done tasks cannot be moved');
  assert.equal(COPY.week.pastDayPill, 'Past day, read only');
  assert.equal(COPY.week.holdForNextWeek, 'Hold for next week');
  assert.equal(COPY.week.emptyDayTitle, 'Nothing planned');
  assert.equal(COPY.common.readOnly, 'Read only');
  assert.equal(COPY.undo.taskDeleted, 'Task deleted');
  assert.equal(COPY.undo.action, 'Undo');
  assert.equal(COPY.settings.remindersFoot, 'Sent only when there is something to say, and always with a count, never a task name.');
  assert.equal(COPY.settings.eveningSub, 'Sent only if rituals are still open.');
  assert.equal(COPY.settings.morningSub, 'Sent only on days that have tasks.');
  assert.equal(COPY.settings.blocked, "Notifications are off for Day Book. Turn them on in your phone's settings.");
  assert.equal(COPY.settings.aboutFoot, 'Everything stays on your phone. There is no account, and nothing is sent anywhere.');
  assert.equal(COPY.permission.title, 'Allow reminders?');
  assert.equal(
    COPY.permission.body,
    'Day Book will ask your phone for permission to send notifications. They only carry counts, like “2 of your 5 rituals are still open today”, never the names of your tasks.'
  );
  assert.equal(COPY.notices.saveFailed, "Couldn't save your latest changes.");
  assert.equal(COPY.notices.newer, 'Your data was saved by a newer Day Book. Update the app to open it. Changes are not saved.');
  assert.equal(COPY.notices.readFailed, "Couldn't open your saved data. Changes are not saved. Close and reopen the app.");
  assert.equal(COPY.notices.unreadable, "Your saved data couldn't be read, so Day Book started empty. A copy was kept.");
  assert.equal(COPY.restore.badFile, 'That isn’t a Day Book backup file. Choose a file saved by Day Book.');
  assert.equal(COPY.restore.offWhileUnreadable, 'Restore is off until your saved data can be read again.');
});

test('Today, ritual and form wording (step 4)', () => {
  assert.equal(COPY.today.newRitual, 'New ritual');
  assert.equal(COPY.today.readOnlySuffix, ' · Read only');
  assert.equal(COPY.ritual.noStreak, 'No streak yet');
  assert.equal(COPY.ritual.namePlaceholder, 'Morning tea');
  assert.equal(COPY.ritual.notePlaceholder, 'Why you do it, or anything to remember');
  assert.equal(COPY.ritual.deleteRitual, 'Delete ritual');
  assert.equal(COPY.ritual.deleteBody, "Its history will be removed too. This can't be undone.");
  assert.equal(COPY.ritual.keepIt, 'Keep it');
  assert.equal(deleteRitualTitle('Morning tea'), 'Delete “Morning tea”?');
  assert.equal(COPY.ritual.notFoundTitle, 'Ritual not found');
  assert.equal(COPY.ritual.notFoundBody, 'It may have been deleted.');
  assert.equal(COPY.ritual.goBack, 'Go back');
});

test('History and Share month wording (step 5)', () => {
  assert.equal(monthDosesLine(101), '101 doses done');
  assert.equal(monthDosesLine(1), '1 dose done');
  assert.equal(monthDosesLine(0), '0 doses done');
  assert.equal(daysLine(21), '21 days');
  assert.equal(daysLine(1), '1 day');
  assert.equal(COPY.history.title, 'History');
  assert.equal(COPY.history.legendAll, 'All done');
  assert.equal(COPY.history.legendSome, 'Some');
  assert.equal(COPY.history.legendNone, 'None');
  assert.equal(COPY.history.noRitualsTitle, 'No rituals yet.');
  assert.equal(COPY.history.noRitualsBody, 'Add one on Today to start filling the month.');
  assert.equal(COPY.share.title, 'Share month');
  assert.equal(COPY.share.close, 'Close');
  assert.equal(COPY.share.look, 'Look');
  assert.equal(COPY.share.note, 'Made on your phone. It shows the dots and the month, never your ritual names or notes.');
  assert.equal(COPY.share.shareImage, 'Share image');
  assert.equal(COPY.share.failed, "Couldn't create the picture. Try again.");
  assert.equal(COPY.share.unavailable, "Sharing isn't available on this device.");
});

test('progress words on Today', () => {
  assert.equal(progressText(3, 5), '3 of 5 done');
  assert.equal(progressText(5, 5), 'All 5 done');
  assert.equal(progressText(0, 5), '0 of 5 done');
  assert.equal(progressLeft(3, 5, true), '2 left');
  assert.equal(progressLeft(5, 5, true), '');
  assert.equal(progressLeft(3, 5, false), '');
});

test('streak line under a ritual name', () => {
  assert.equal(streakLine(12), '12 day streak');
  assert.equal(streakLine(1), '1 day streak');
  assert.equal(streakLine(0), 'Start a streak today');
});

test('count lines', () => {
  assert.equal(dayCountLine(3, 5), '3 of 5 done');
  assert.equal(taskCountLine(4, 2), '4 tasks, 2 done');
  assert.equal(taskCountLine(3, 0), '3 tasks');
  assert.equal(taskCountLine(1, 1), '1 task, 1 done');
  assert.equal(taskCountLine(0, 0), 'No tasks');
});

test('Settings wording (step 8)', () => {
  assert.equal(COPY.settings.title, 'Settings');
  assert.equal(COPY.settings.reminders, 'Reminders');
  // Mazhar, 3 November 2026: names without a time of day, since either can be set to any time.
  assert.equal(COPY.settings.ritualReminder, 'Ritual reminder');
  assert.equal(COPY.settings.taskReminder, 'Task reminder');
  assert.equal(COPY.settings.time, 'Time');
  assert.equal(COPY.settings.appearance, 'Appearance');
  assert.equal(COPY.settings.feel, 'Feel');
  assert.equal(COPY.settings.haptics, 'Haptics');
  assert.equal(COPY.settings.hapticsFoot, 'Small taps when you tick, move a task or save.');
  assert.equal(COPY.settings.backup, 'Backup');
  assert.equal(COPY.settings.saveBackup, 'Save a backup');
  assert.equal(COPY.settings.restoreBackup, 'Restore from a backup file');
  assert.equal(COPY.settings.about, 'About');
  assert.equal(COPY.settings.howItWorks, 'How Day Book works');
  assert.equal(COPY.settings.version, 'Version');
  assert.equal(COPY.settings.openPhoneSettings, 'Open phone settings');
  assert.equal(COPY.permission.continue, 'Continue');
  assert.equal(COPY.permission.notNow, 'Not now');
  assert.equal(
    lastBackupLine('12 October 2026'),
    'Last backup: 12 October 2026. A backup is one file with every ritual, its history, its note and your tasks. Send it to Drive or email it to yourself.'
  );
  assert.equal(lastBackupLine(null).startsWith('Last backup: never. A backup is one file'), true);
  assert.equal(COPY.restore.newerFile, 'That backup is from a newer version of Day Book. Update the app, then try again.');
  assert.equal(COPY.restore.saveFailed, 'Couldn’t create the backup file. Try again.');
  assert.equal(COPY.restore.sharingUnavailable, 'Sharing isn’t available on this device.');
});

test('How Day Book works wording (step 8)', () => {
  assert.equal(COPY.how.title, 'How Day Book works');
  assert.equal(COPY.how.lead, 'Two kinds of things live here. Rituals are what you do every day. Tasks belong to one day only.');
  assert.deepEqual(
    COPY.how.sections.map((s) => s.title),
    ['Rituals', 'Fixing a day', 'Week', 'History', 'Reminders', 'Your data']
  );
  assert.equal(
    COPY.how.sections[1].body,
    'Forgot to tick something? You can still change yesterday. Older days are kept as a record you can look at but not change.'
  );
  assert.equal(
    COPY.how.sections[4].body,
    'A ritual reminder if rituals are still open, and a task reminder with how many tasks you have that day. Both are off until you turn them on in Settings, where you also set the times. The words show on the lock screen, with a count and never a task name.'
  );
  assert.equal(COPY.how.rituals, 'Rituals');
  assert.equal(COPY.how.tasks, 'Tasks');
  assert.equal(
    COPY.how.sections[5].body,
    "Everything stays on your phone. There is no account. Save a backup from Settings now and then, so a lost phone doesn't take your days with it."
  );
});

test('moving a task (step 10)', () => {
  assert.equal(moveToLine('2026-11-12'), 'Move to Thursday 12');
  assert.equal(movedToLine('2026-11-05'), 'Moved to Thursday 5');
  assert.equal(COPY.week.holdForNextWeek, 'Hold for next week');
  // Not on the board, which only draws the next-week arrow.
  assert.equal(COPY.week.holdForPreviousWeek, 'Hold for previous week');
  assert.equal(COPY.week.moveAction, 'Move to another day');
  assert.equal(COPY.week.deleteAction, 'Delete');
});

test('morning note carries only a count', () => {
  assert.deepEqual(morningNote(4), { title: 'You have 4 tasks today', body: 'Open Day Book to see them.' });
  assert.deepEqual(morningNote(1), { title: 'You have 1 task today', body: 'Open Day Book to see it.' });
});
