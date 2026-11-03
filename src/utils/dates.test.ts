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

// Weeks start on Sunday everywhere in 2.0.0 (design board).
test('weekDatesFor starts on Sunday', () => {
  // 2026-11-04 is a Wednesday, the day the board shows.
  assert.deepEqual(weekDatesFor('2026-11-04'), [
    '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04',
    '2026-11-05', '2026-11-06', '2026-11-07',
  ]);
});

test('weekDatesFor treats Sunday as the first day and Saturday as the last', () => {
  // 2026-10-18 is a Sunday and 2026-10-24 a Saturday.
  assert.equal(weekDatesFor('2026-10-18')[0], '2026-10-18');
  assert.equal(weekDatesFor('2026-10-24')[0], '2026-10-18');
  assert.equal(weekDatesFor('2026-10-24')[6], '2026-10-24');
});

test('weekDatesFor crosses a month and a year boundary', () => {
  // 2026-10-29 is a Thursday; 2026-12-31 is a Thursday.
  assert.equal(weekDatesFor('2026-10-29')[0], '2026-10-25');
  assert.equal(weekDatesFor('2026-10-29')[6], '2026-10-31');
  const week = weekDatesFor('2026-12-31');
  assert.equal(week[0], '2026-12-27');
  assert.equal(week[6], '2027-01-02');
});