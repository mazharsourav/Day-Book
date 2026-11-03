/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { earliestMonth, getCalendarDays, monthPrefix, shiftMonth } from './calendar';

// The grid is Sunday-first in 2.0.0 (design board).
test('October 2026 starts on a Thursday and has 31 days', () => {
  const days = getCalendarDays(2026, 9);
  assert.deepEqual(days.slice(0, 5), [null, null, null, null, 1]);
  assert.equal(days.length, 4 + 31);
  assert.equal(days[days.length - 1], 31);
});

test('a month that starts on Sunday has no leading blanks', () => {
  // 2026-11-01 is a Sunday.
  const days = getCalendarDays(2026, 10);
  assert.equal(days[0], 1);
  assert.equal(days.length, 30);
});

test('a month that starts on Monday gets one leading blank', () => {
  // 2026-06-01 is a Monday.
  const days = getCalendarDays(2026, 5);
  assert.deepEqual(days.slice(0, 2), [null, 1]);
  assert.equal(days.length, 1 + 30);
});

test('a month that starts on Saturday gets six leading blanks', () => {
  // 2026-08-01 is a Saturday.
  const days = getCalendarDays(2026, 7);
  assert.equal(days.filter((d) => d === null).length, 6);
  assert.equal(days[6], 1);
});

test('February in a leap year has 29 days', () => {
  const days = getCalendarDays(2028, 1).filter((d) => d !== null);
  assert.equal(days.length, 29);
});

test('shiftMonth goes back and forward across a year', () => {
  assert.deepEqual(shiftMonth({ year: 2026, month: 0 }, -1), { year: 2025, month: 11 });
  assert.deepEqual(shiftMonth({ year: 2026, month: 11 }, 1), { year: 2027, month: 0 });
  assert.deepEqual(shiftMonth({ year: 2026, month: 9 }, -10), { year: 2025, month: 11 });
  assert.deepEqual(shiftMonth({ year: 2026, month: 9 }, 0), { year: 2026, month: 9 });
});

test('monthPrefix pads the month', () => {
  assert.equal(monthPrefix({ year: 2026, month: 2 }), '2026-03');
  assert.equal(monthPrefix({ year: 2026, month: 11 }), '2026-12');
});

test('earliestMonth finds the oldest date', () => {
  const fallback = { year: 2026, month: 9 };
  assert.deepEqual(
    earliestMonth(['2026-08-14', '2026-03-02', '2026-10-01'], fallback),
    { year: 2026, month: 2 }
  );
});

test('earliestMonth falls back when there are no dates', () => {
  const fallback = { year: 2026, month: 9 };
  assert.deepEqual(earliestMonth([], fallback), fallback);
});

test('earliestMonth never goes later than the fallback', () => {
  const fallback = { year: 2026, month: 9 };
  assert.deepEqual(earliestMonth(['2027-01-01'], fallback), fallback);
});

test('earliestMonth ignores malformed dates', () => {
  const fallback = { year: 2026, month: 9 };
  assert.deepEqual(earliestMonth(['', 'nope', '2026-05-09'], fallback), { year: 2026, month: 4 });
});