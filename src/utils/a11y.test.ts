/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  badgeText,
  dayLabel,
  lockedTickLabel,
  progressLabel,
  ritualDayLabel,
  ritualNameLabel,
  taskLabel,
  tickLabel,
  weekTabLabel,
} from './a11y';

// The wording on the board's "Reading aloud and reaching" card.
test('ritual circle', () => {
  assert.deepEqual(tickLabel('Run', false), { label: 'Mark Run as done', hint: undefined });
  assert.deepEqual(tickLabel('Run', true), { label: 'Run, done today', hint: 'Double tap to undo' });
});

test('a circle on a read-only day', () => {
  assert.equal(lockedTickLabel('Run', true), 'Run, done. Read only.');
  assert.equal(lockedTickLabel('Run', false), 'Run, not done. Read only.');
});

test('ritual name', () => {
  assert.equal(ritualNameLabel('Run', 12), 'Run, 12 day streak. Opens the ritual.');
  assert.equal(ritualNameLabel('Run', 0), 'Run, no streak yet. Opens the ritual.');
});

test('progress bar', () => {
  assert.equal(progressLabel(3, 5, true), '3 of 5 done, 2 left.');
  assert.equal(progressLabel(5, 5, true), 'All 5 done.');
  assert.equal(progressLabel(3, 5, false), '3 of 5 done.');
});

test('a day in the strip', () => {
  assert.equal(dayLabel('2026-11-04', '2026-11-04', 3, 5), 'Wednesday 4 November, today, 3 of 5 done.');
  assert.equal(dayLabel('2026-11-03', '2026-11-04', 4, 5), 'Tuesday 3 November, yesterday, 4 of 5 done.');
  assert.equal(dayLabel('2026-11-02', '2026-11-04', 3, 5), 'Monday 2 November, 3 of 5 done. Read only.');
  assert.equal(dayLabel('2026-11-06', '2026-11-04', 0, 5), 'Friday 6 November.');
});

test('a task', () => {
  assert.deepEqual(taskLabel('Send invoice', '2026-11-04', false, false), {
    label: 'Send invoice, Wednesday, not done',
    hint: 'Double tap to mark done',
  });
  assert.deepEqual(taskLabel('Send invoice', '2026-11-04', true, false), {
    label: 'Send invoice, Wednesday, done',
    hint: 'Double tap to undo',
  });
  assert.deepEqual(taskLabel('Send invoice', '2026-11-02', false, true), {
    label: 'Send invoice, Monday, not done. Read only.',
    hint: undefined,
  });
});

test('week tab', () => {
  assert.equal(weekTabLabel(2), 'Week, 2 tasks open today');
  assert.equal(weekTabLabel(1), 'Week, 1 task open today');
  assert.equal(weekTabLabel(0), 'Week');
});

test('badge text', () => {
  assert.equal(badgeText(0), '');
  assert.equal(badgeText(2), '2');
  assert.equal(badgeText(99), '99');
  assert.equal(badgeText(100), '99+');
});

test('a day on the ritual screen says if it can change', () => {
  const today = '2026-11-04';
  assert.deepEqual(ritualDayLabel('2026-11-04', today, true), {
    label: 'Wednesday 4 November, today',
    hint: 'Double tap to undo',
  });
  assert.deepEqual(ritualDayLabel('2026-11-03', today, false), {
    label: 'Tuesday 3 November, yesterday',
    hint: 'Double tap to mark done',
  });
  assert.deepEqual(ritualDayLabel('2026-11-01', today, true), { label: 'Sunday 1 November. Read only.', hint: undefined });
  assert.deepEqual(ritualDayLabel('2026-11-05', today, false), { label: 'Thursday 5 November, upcoming', hint: undefined });
});
