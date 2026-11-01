/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, fromDateString, toDateString, weekDatesFor } from './dates';

test('toDateString pads month and day', () => {
  assert.equal(toDateString(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(toDateString(new Date(2026, 11, 31)), '2026-12-31');
});

test('fromDateString reads a local date, not UTC', () => {
  const d = fromDateString('2026-10-13');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 9);
  assert.equal(d.getDate(), 13);
});

test('round trip keeps the same string', () => {
  for (const s of ['2026-03-08', '2026-11-01', '2028-02-29', '2027-01-01']) {
    assert.equal(toDateString(fromDateString(s)), s);
  }
});

test('addDays moves across month, year and leap day', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2028-03-01', -1), '2028-02-29');
  assert.equal(addDays('2026-10-13', 0), '2026-10-13');
});

test('weekDatesFor starts on Monday', () => {
  // 2026-10-13 is a Tuesday.
  assert.deepEqual(weekDatesFor('2026-10-13'), [
    '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15',
    '2026-10-16', '2026-10-17', '2026-10-18',
  ]);
});

test('weekDatesFor treats Sunday as the last day of the week', () => {
  // 2026-10-18 is a Sunday.
  const week = weekDatesFor('2026-10-18');
  assert.equal(week[0], '2026-10-12');
  assert.equal(week[6], '2026-10-18');
});

test('weekDatesFor crosses a month boundary', () => {
  // 2026-11-01 is a Sunday.
  const week = weekDatesFor('2026-11-01');
  assert.equal(week[0], '2026-10-26');
  assert.equal(week[6], '2026-11-01');
});