/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COPY, emptyDayBody } from '../constants/copy';
import type { Task } from '../types';
import {
  canGoToEarlierFormWeek,
  formStrip,
  isReadOnlyDay,
  shiftWeek,
  weekDayHeading,
  weekDaySubtitle,
  weekRangeFor,
  weekStrip,
} from './weekModel';

// The board's "today" is Wednesday 4 November 2026.
const TODAY = '2026-11-04';
const AT = '2026-11-01T09:00:00.000Z';
const t = (id: string, date: string, done = false): Task => ({ id, title: id, date, done, createdAt: AT });

const tasks = [t('a', '2026-11-01', true), t('b', '2026-11-03', true), t('c', '2026-11-03'), t('d', TODAY)];

test('the strip is the Sunday-first week of the chosen day, with a dot for how much is done', () => {
  const strip = weekStrip('2026-11-03', TODAY, tasks);
  assert.deepEqual(strip.map((d) => d.number), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(strip.map((d) => d.dot), ['all', 'none', 'some', 'some', 'none', 'none', 'none']);
  assert.equal(strip[2].selected, true);
  assert.equal(strip[3].isToday, true);
  // Every day of any week can be chosen on Week, past days included (to read them).
  assert.ok(strip.every((d) => !d.disabled));
});

test('the range label and the week of a day', () => {
  assert.equal(weekRangeFor(TODAY), '1 – 7 November');
  assert.equal(weekRangeFor('2026-10-28'), '25 – 31 October');
  assert.equal(weekRangeFor('2026-11-30'), '29 November – 5 December');
});

test('the arrows move a week and keep the weekday', () => {
  assert.equal(shiftWeek(TODAY, 1), '2026-11-11');
  assert.equal(shiftWeek(TODAY, -1), '2026-10-28');
});

test('the day heading is Today or the weekday, with the date and the count', () => {
  assert.equal(weekDayHeading(TODAY, TODAY), 'Today');
  assert.equal(weekDayHeading('2026-11-03', TODAY), 'Tuesday');
  assert.equal(weekDaySubtitle(TODAY, tasks), '4 November · 1 task');
  assert.equal(weekDaySubtitle('2026-11-03', tasks), '3 November · 2 tasks, 1 done');
  assert.equal(weekDaySubtitle('2026-11-07', tasks), '7 November · No tasks');
});

test('past days and earlier weeks are read only', () => {
  assert.equal(isReadOnlyDay('2026-11-03', TODAY), true);
  assert.equal(isReadOnlyDay('2026-10-30', TODAY), true);
  assert.equal(isReadOnlyDay(TODAY, TODAY), false);
  assert.equal(isReadOnlyDay('2026-11-05', TODAY), false);
  assert.ok(weekStrip('2026-10-28', TODAY, tasks).every((d) => isReadOnlyDay(d.date, TODAY)));
});

test('an empty day says what to do, except a past day', () => {
  assert.equal(COPY.week.emptyDayTitle, 'Nothing planned');
  assert.equal(emptyDayBody('Saturday'), 'Tap Add task to plan Saturday.');
});

test('the form Day picker: past days cannot be chosen, and no dots', () => {
  const strip = formStrip('2026-11-05', TODAY);
  assert.deepEqual(strip.map((d) => d.disabled), [true, true, true, false, false, false, false]);
  assert.ok(strip.every((d) => d.dot === 'none'));
  assert.equal(strip[4].selected, true);
});

test('the form cannot go back to a week that is all in the past', () => {
  assert.equal(canGoToEarlierFormWeek('2026-11-11', TODAY), true);
  assert.equal(canGoToEarlierFormWeek(TODAY, TODAY), false);
  // Sunday 8 November: the week before ends on Saturday 7, still ahead of today.
  assert.equal(canGoToEarlierFormWeek('2026-11-08', TODAY), true);
});

test('form wording', () => {
  assert.equal(COPY.week.title, 'Week');
  assert.equal(COPY.week.titleLabel, 'Title');
  assert.equal(COPY.week.dayLabel, 'Day');
  assert.equal(COPY.week.titlePlaceholder, 'What needs doing?');
});
