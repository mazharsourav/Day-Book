/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COPY } from '../constants/copy';
import { daySheetSubtitle, daySheetTitle, historyWeeks, ritualDaysInMonth } from './historyModel';

const TODAY = '2026-11-04';
const OCT = { year: 2026, month: 9 };
const NOV = { year: 2026, month: 10 };

test('October 2026 on a Sunday-first grid: four empty cells, then Thursday 1', () => {
  const weeks = historyWeeks([], OCT, TODAY);
  assert.equal(weeks.length, 5);
  assert.deepEqual(weeks[0].map((c) => c?.day ?? null), [null, null, null, null, 1, 2, 3]);
  assert.deepEqual(weeks[4].map((c) => c?.day ?? null), [25, 26, 27, 28, 29, 30, 31]);
  assert.ok(weeks.every((w) => w.length === 7));
});

test('November 2026 starts on Sunday; today is ringed and later days wait', () => {
  const rituals = [{ completedDates: ['2026-11-01', '2026-11-02'] }, { completedDates: ['2026-11-01'] }];
  const weeks = historyWeeks(rituals, NOV, TODAY);
  assert.equal(weeks[0][0]?.day, 1);
  assert.equal(weeks[0][0]?.state, 'all');
  assert.equal(weeks[0][1]?.state, 'some');
  assert.equal(weeks[0][2]?.state, 'none');
  assert.equal(weeks[0][3]?.isToday, true);
  assert.equal(weeks[0][4]?.state, 'future');
  assert.equal(weeks[0][0]?.date, '2026-11-01');
  // 30 days from a Sunday: four full weeks and two days, padded to seven.
  assert.equal(weeks.length, 5);
  assert.deepEqual(weeks[4].map((c) => c?.day ?? null), [29, 30, null, null, null, null, null]);
});

test('days per ritual count only the month on screen', () => {
  assert.equal(ritualDaysInMonth(['2026-10-01', '2026-10-31', '2026-11-01'], OCT), 2);
  assert.equal(ritualDaysInMonth([], OCT), 0);
});

// Mazhar, 3 November 2026: History is only for reading. Today and yesterday are changed on Today.
test('every day in History is read only and points to Today', () => {
  assert.equal(daySheetTitle('2026-11-03'), 'Tuesday 3 November');
  assert.equal(daySheetSubtitle(4, 5), '4 of 5 done · Read only');
  assert.equal(daySheetSubtitle(3, 5), '3 of 5 done · Read only');
  assert.equal(COPY.history.readOnlyHint, 'You can change today and yesterday on Today.');
});
