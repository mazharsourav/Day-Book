/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Task } from '../types';
import {
  alreadySentToday,
  MORNING_DAYS,
  nextSentRecord,
  planAll,
  planMorning,
  planReminders,
  reminderText,
  stillWorthSending,
} from './reminderPlan';
import { DEFAULT_REMINDERS, withSlot } from './reminderSettings';

// Local times, so these hold in any time zone.
const MORNING = new Date(2026, 9, 13, 9, 0); // 13 Oct 2026, 09:00
const NINE_PM = new Date(2026, 9, 13, 21, 0);

const open = { completedDates: [] as string[] };
const takenToday = { completedDates: ['2026-10-13', '2026-10-12', '2026-10-11'] };
const streakOf5 = { completedDates: ['2026-10-12', '2026-10-11', '2026-10-10', '2026-10-09', '2026-10-08'] };

test('no rituals means no reminders', () => {
  assert.deepEqual(planReminders([], MORNING), []);
});

test('one reminder a day for 30 days, always at 8 PM', () => {
  const plan = planReminders([open], MORNING);
  assert.equal(plan.length, 30);
  for (const r of plan) {
    assert.equal(r.date.getHours(), 20);
    assert.equal(r.date.getMinutes(), 0);
  }
  assert.equal(plan[0].date.getDate(), 13);
  assert.equal(plan[1].date.getDate(), 14);
});

test('after 8 PM the first reminder is tomorrow', () => {
  // The window is 30 calendar days from today, and today's 8 PM has passed.
  const plan = planReminders([open], NINE_PM);
  assert.equal(plan.length, 29);
  assert.equal(plan[0].date.getDate(), 14);
});

test('nothing is sent today when every ritual is taken', () => {
  const plan = planReminders([takenToday, takenToday], MORNING);
  assert.equal(plan.length, 29);
  assert.equal(plan[0].date.getDate(), 14);
});

test('one open ritual is enough to remind', () => {
  const plan = planReminders([takenToday, open, open], MORNING);
  assert.equal(plan[0].date.getDate(), 13);
  assert.equal(plan[0].title, '2 of your 3 rituals are still open today');
});

test("today's text uses the streak of an open ritual, counted through yesterday", () => {
  const plan = planReminders([streakOf5, takenToday], MORNING);
  assert.equal(plan[0].title, '1 of your 2 rituals is still open today');
  assert.equal(plan[0].body, 'Keep your 5-day streak going.');
});

test('tomorrow keeps a streak that today extends', () => {
  const plan = planReminders([takenToday], MORNING);
  // Taken today, so today is skipped. Tomorrow the streak is 3 (11th, 12th, 13th).
  assert.equal(plan[0].date.getDate(), 14);
  assert.equal(plan[0].body, 'Keep your 3-day streak going.');
});

test('days further out have no streak text', () => {
  const plan = planReminders([takenToday], MORNING);
  assert.equal(plan[2].body, "There's still time today.");
});

test('the time stays 8 PM across a daylight saving change', () => {
  // Whatever the machine time zone is, every planned reminder is at 20:00 local.
  const plan = planReminders([open], new Date(2026, 2, 1, 9, 0), 40);
  assert.equal(plan.length, 40);
  assert.ok(plan.every((r) => r.date.getHours() === 20));
});

test('a window of one day plans at most one reminder', () => {
  assert.equal(planReminders([open], MORNING, 1).length, 1);
  assert.equal(planReminders([open], NINE_PM, 1).length, 0);
});

test('the wording handles one, some and all', () => {
  assert.deepEqual(reminderText(1, 1, 0), {
    title: 'Your ritual is still open today',
    body: "There's still time today.",
  });
  assert.equal(reminderText(5, 5, 0).title, 'All 5 rituals are still open today');
  assert.equal(reminderText(3, 5, 0).title, '3 of your 5 rituals are still open today');
  assert.equal(reminderText(1, 4, 0).title, '1 of your 4 rituals is still open today');
});

test('a streak of 1 is not worth mentioning', () => {
  assert.equal(reminderText(2, 3, 1).body, "There's still time today.");
  assert.equal(reminderText(2, 3, 2).body, 'Keep your 2-day streak going.');
});

// Step 8: the evening time can be chosen, and each reminder says what it is and which day it is for.

test('the evening reminder follows the chosen time', () => {
  const plan = planReminders([open], MORNING, 30, { time: { hour: 21, minute: 30 } });
  assert.equal(plan.length, 30);
  assert.ok(plan.every((r) => r.date.getHours() === 21 && r.date.getMinutes() === 30));
  assert.equal(plan[0].kind, 'evening');
  assert.equal(plan[0].day, '2026-10-13');
  assert.equal(plan[1].day, '2026-10-14');
});

test('an evening time already past today starts tomorrow', () => {
  const plan = planReminders([open], MORNING, 30, { time: { hour: 8, minute: 30 } });
  assert.equal(plan[0].day, '2026-10-14');
});

test('the evening plan can skip today when today was already sent', () => {
  const plan = planReminders([open], MORNING, 30, { skipToday: true });
  assert.equal(plan.length, 29);
  assert.equal(plan[0].day, '2026-10-14');
});

const task = (id: string, date: string, done = false): Task => ({ id, title: `Task ${id}`, date, done, createdAt: '2026-10-01T09:00:00.000Z' });

test('the morning note counts the open tasks of each day, 14 days ahead', () => {
  const EARLY = new Date(2026, 9, 13, 6, 0); // 13 Oct, 06:00, before 8:00
  const tasks = [
    task('a', '2026-10-13'),
    task('b', '2026-10-13'),
    task('c', '2026-10-14'),
    task('d', '2026-10-14', true),
    task('e', '2026-10-26'), // day 14 counted from today (13 + 13)
    task('f', '2026-10-27'), // day 15: outside the window
  ];
  const plan = planMorning(tasks, EARLY, { time: { hour: 8, minute: 0 } });
  assert.equal(MORNING_DAYS, 14);
  assert.deepEqual(
    plan.map((p) => [p.day, p.title]),
    [
      ['2026-10-13', 'You have 2 tasks today'],
      ['2026-10-14', 'You have 1 task today'],
      ['2026-10-26', 'You have 1 task today'],
    ]
  );
  assert.equal(plan[0].body, 'Open Day Book to see them.');
  assert.equal(plan[1].body, 'Open Day Book to see it.');
  assert.ok(plan.every((p) => p.kind === 'morning' && p.date.getHours() === 8 && p.date.getMinutes() === 0));
});

test('no morning note on a day with no tasks, or whose tasks are all done', () => {
  const EARLY = new Date(2026, 9, 13, 6, 0);
  assert.deepEqual(planMorning([], EARLY, {}), []);
  assert.deepEqual(planMorning([task('a', '2026-10-13', true)], EARLY, {}), []);
});

test('the morning note skips today once its time has passed, or when today was already sent', () => {
  const tasks = [task('a', '2026-10-13'), task('b', '2026-10-14')];
  // 09:00 is after the 8:00 default.
  assert.deepEqual(planMorning(tasks, MORNING, {}).map((p) => p.day), ['2026-10-14']);
  assert.deepEqual(planMorning(tasks, MORNING, { time: { hour: 10, minute: 0 } }).map((p) => p.day), ['2026-10-13', '2026-10-14']);
  assert.deepEqual(
    planMorning(tasks, MORNING, { time: { hour: 10, minute: 0 }, skipToday: true }).map((p) => p.day),
    ['2026-10-14']
  );
});

test("a note counts as sent today once today's planned time has passed", () => {
  const at8 = new Date(2026, 9, 13, 8, 0).getTime();
  assert.equal(alreadySentToday({ day: '2026-10-13', at: at8 }, MORNING), true);
  assert.equal(alreadySentToday({ day: '2026-10-13', at: at8 }, new Date(2026, 9, 13, 7, 0)), false);
  assert.equal(alreadySentToday({ day: '2026-10-12', at: at8 }, MORNING), false);
  assert.equal(alreadySentToday(undefined, MORNING), false);
});

test("the record keeps a note already sent today, otherwise follows today's plan", () => {
  const at8 = new Date(2026, 9, 13, 8, 0).getTime();
  const sent = { day: '2026-10-13', at: at8 };
  const later = planMorning([task('a', '2026-10-13')], MORNING, { time: { hour: 10, minute: 0 } });
  // Already sent at 8:00: kept, even though the plan has a new time.
  assert.deepEqual(nextSentRecord(sent, later, MORNING), sent);
  // Not yet sent: today's planned time is remembered.
  assert.deepEqual(nextSentRecord(undefined, later, MORNING), { day: '2026-10-13', at: later[0].date.getTime() });
  // Nothing planned today and nothing sent: no record.
  assert.equal(nextSentRecord(undefined, [], MORNING), undefined);
});

test('a late note is still worth sending only while its reminder is on and something is still open that day', () => {
  const on = withSlot(withSlot(DEFAULT_REMINDERS, 'evening', { on: true }), 'morning', { on: true });
  const day = '2026-10-13';
  const rituals = [open, takenToday];
  const tasks = [task('a', day), task('b', day, true)];
  assert.equal(stillWorthSending({ kind: 'evening', day }, on, rituals, tasks), true);
  assert.equal(stillWorthSending({ kind: 'morning', day }, on, rituals, tasks), true);
  // Everything ticked since the note was planned: nothing to say.
  assert.equal(stillWorthSending({ kind: 'evening', day }, on, [takenToday], tasks), false);
  assert.equal(stillWorthSending({ kind: 'morning', day }, on, rituals, [task('b', day, true)]), false);
  // Switched off since.
  assert.equal(stillWorthSending({ kind: 'evening', day }, DEFAULT_REMINDERS, rituals, tasks), false);
});

test('planAll plans only the reminders that are on, and never sends one twice in a day', () => {
  const rituals = [open];
  const tasks = [task('a', '2026-10-13')];
  assert.deepEqual(planAll(DEFAULT_REMINDERS, rituals, tasks, MORNING, {}).plan, []);

  const both = withSlot(withSlot(DEFAULT_REMINDERS, 'evening', { on: true }), 'morning', { on: true, hour: 10 });
  const first = planAll(both, rituals, tasks, MORNING, {});
  assert.equal(first.plan.filter((p) => p.kind === 'evening').length, 30);
  assert.deepEqual(first.plan.filter((p) => p.kind === 'morning').map((p) => p.day), ['2026-10-13']);
  assert.equal(first.sent.morning?.day, '2026-10-13');

  // 10:30: the morning note went out at 10:00. Moving it to 11:00 does not send it again today.
  const half10 = new Date(2026, 9, 13, 10, 30);
  const moved = withSlot(both, 'morning', { hour: 11 });
  const again = planAll(moved, rituals, tasks, half10, first.sent);
  assert.deepEqual(again.plan.filter((p) => p.kind === 'morning'), []);
  assert.deepEqual(again.sent.morning, first.sent.morning);
});
