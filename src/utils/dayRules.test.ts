/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayKind, isEditableRitualDay, selectedDayAfterRollover, weekRangeLabel } from './dayRules';

const TODAY = '2026-11-04';

test('only today and yesterday can be changed for a ritual', () => {
  assert.equal(isEditableRitualDay('2026-11-04', TODAY), true);
  assert.equal(isEditableRitualDay('2026-11-03', TODAY), true);
  assert.equal(isEditableRitualDay('2026-11-02', TODAY), false);
  assert.equal(isEditableRitualDay('2026-10-04', TODAY), false);
  assert.equal(isEditableRitualDay('2026-11-05', TODAY), false);
});

test('yesterday works across a month and a year', () => {
  assert.equal(isEditableRitualDay('2026-10-31', '2026-11-01'), true);
  assert.equal(isEditableRitualDay('2026-12-31', '2027-01-01'), true);
  assert.equal(isEditableRitualDay('2026-12-30', '2027-01-01'), false);
});

test('dayKind sorts days into past, today and future', () => {
  assert.equal(dayKind('2026-11-03', TODAY), 'past');
  assert.equal(dayKind('2026-11-04', TODAY), 'today');
  assert.equal(dayKind('2026-11-05', TODAY), 'future');
});

test('weekRangeLabel matches the board', () => {
  assert.equal(weekRangeLabel('2026-11-01'), '1 – 7 November');
  assert.equal(weekRangeLabel('2026-10-25'), '25 – 31 October');
  assert.equal(weekRangeLabel('2026-11-08'), '8 – 14 November');
});

test('weekRangeLabel names both months when a week crosses one', () => {
  assert.equal(weekRangeLabel('2026-11-29'), '29 November – 5 December');
  assert.equal(weekRangeLabel('2026-12-27'), '27 December – 2 January');
});

// At midnight the screen follows today only if you were looking at today.
test('selected day after midnight', () => {
  assert.equal(selectedDayAfterRollover('2026-11-04', '2026-11-04', '2026-11-05'), '2026-11-05');
  assert.equal(selectedDayAfterRollover('2026-11-03', '2026-11-04', '2026-11-05'), '2026-11-03');
  assert.equal(selectedDayAfterRollover('2026-11-04', '2026-11-04', '2026-11-04'), '2026-11-04');
});
