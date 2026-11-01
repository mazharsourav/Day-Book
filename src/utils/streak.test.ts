/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeStreak } from './streak';

test('no days taken is a streak of 0', () => {
  assert.equal(computeStreak([], '2026-10-13'), 0);
});

test('only today taken is 1', () => {
  assert.equal(computeStreak(['2026-10-13'], '2026-10-13'), 1);
});

test('counts consecutive days ending today', () => {
  assert.equal(computeStreak(['2026-10-13', '2026-10-12', '2026-10-11'], '2026-10-13'), 3);
});

test('keeps the streak through yesterday when today is not taken yet', () => {
  assert.equal(computeStreak(['2026-10-12', '2026-10-11', '2026-10-10'], '2026-10-13'), 3);
});

test('breaks once a whole day is missed', () => {
  assert.equal(computeStreak(['2026-10-11', '2026-10-10'], '2026-10-13'), 0);
});

test('a gap ends the count', () => {
  assert.equal(computeStreak(['2026-10-13', '2026-10-12', '2026-10-10', '2026-10-09'], '2026-10-13'), 2);
});

test('order of the saved dates does not matter', () => {
  assert.equal(computeStreak(['2026-10-11', '2026-10-13', '2026-10-12'], '2026-10-13'), 3);
});

test('counts across a month boundary', () => {
  assert.equal(computeStreak(['2026-11-01', '2026-10-31', '2026-10-30'], '2026-11-01'), 3);
});

test('counts across a year boundary', () => {
  assert.equal(computeStreak(['2027-01-01', '2026-12-31', '2026-12-30'], '2027-01-01'), 3);
});

test('counts across a leap day', () => {
  assert.equal(computeStreak(['2028-03-01', '2028-02-29', '2028-02-28'], '2028-03-01'), 3);
});

test('counts across daylight saving changes', () => {
  // US clocks go forward on 2026-03-08 and back on 2026-11-01.
  assert.equal(computeStreak(['2026-03-09', '2026-03-08', '2026-03-07'], '2026-03-09'), 3);
  assert.equal(computeStreak(['2026-11-02', '2026-11-01', '2026-10-31'], '2026-11-02'), 3);
});

test('a future day alone is not a streak', () => {
  assert.equal(computeStreak(['2026-10-14'], '2026-10-13'), 0);
});

test('duplicate dates are counted once', () => {
  assert.equal(computeStreak(['2026-10-13', '2026-10-13', '2026-10-12'], '2026-10-13'), 2);
});