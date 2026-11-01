/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planReminders, reminderText } from './reminderPlan';

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
