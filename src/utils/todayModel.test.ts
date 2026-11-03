/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canSaveRitualName,
  cleanRitualName,
  dayDateLine,
  dayDotState,
  dayHeading,
  doneOn,
  ritualMonth,
  ritualWeek,
  RITUAL_NAME_MAX,
  showAllDoneNote,
  todayStrip,
  todaySubtitle,
} from './todayModel';

// The board's "today" is Wednesday 4 November 2026.
const TODAY = '2026-11-04';

const ritual = (id: string, completedDates: string[]) => ({ id, completedDates });

test('the title is Today, Yesterday or the weekday', () => {
  assert.equal(dayHeading(TODAY, TODAY), 'Today');
  assert.equal(dayHeading('2026-11-03', TODAY), 'Yesterday');
  assert.equal(dayHeading('2026-11-01', TODAY), 'Sunday');
  assert.equal(dayHeading('2026-11-02', TODAY), 'Monday');
});

test('the line under the title, with Read only on older days', () => {
  assert.equal(dayDateLine(TODAY), 'Wednesday, 4 November');
  assert.equal(todaySubtitle(TODAY, TODAY), 'Wednesday, 4 November');
  assert.equal(todaySubtitle('2026-11-03', TODAY), 'Tuesday, 3 November');
  assert.equal(todaySubtitle('2026-11-01', TODAY), 'Sunday, 1 November · Read only');
});

test('a day is all, some or none done', () => {
  const rituals = [ritual('a', [TODAY, '2026-11-03']), ritual('b', [TODAY])];
  assert.equal(dayDotState(rituals, TODAY), 'all');
  assert.equal(dayDotState(rituals, '2026-11-03'), 'some');
  assert.equal(dayDotState(rituals, '2026-11-02'), 'none');
  assert.equal(dayDotState([], TODAY), 'none');
  assert.equal(doneOn(rituals, '2026-11-03'), 1);
});

test('the Today strip is the Sunday-first week of today', () => {
  const rituals = [ritual('a', ['2026-11-01', TODAY]), ritual('b', ['2026-11-01'])];
  const strip = todayStrip(TODAY, '2026-11-03', rituals);
  assert.deepEqual(
    strip.map((d) => d.date),
    ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']
  );
  assert.deepEqual(strip.map((d) => d.letter).join(''), 'SMTWTFS');
  assert.deepEqual(strip.map((d) => d.number), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(strip.map((d) => d.dot), ['all', 'none', 'none', 'some', 'none', 'none', 'none']);
  assert.equal(strip[3].isToday, true);
  assert.equal(strip[2].selected, true);
  assert.deepEqual(strip.map((d) => d.isFuture), [false, false, false, false, true, true, true]);
});

test('a future day never shows a dot', () => {
  const rituals = [ritual('a', ['2026-11-05'])];
  assert.equal(todayStrip(TODAY, TODAY, rituals)[4].dot, 'none');
});

test('"Nothing left for today" shows only on today with everything done', () => {
  assert.equal(showAllDoneNote(5, 5, true), true);
  assert.equal(showAllDoneNote(4, 5, true), false);
  assert.equal(showAllDoneNote(5, 5, false), false);
  assert.equal(showAllDoneNote(0, 0, true), false);
});

test('the ritual week: older days are a record, today and yesterday can change, later days wait', () => {
  const week = ritualWeek(['2026-11-01', '2026-11-03'], TODAY);
  assert.deepEqual(
    week.map((d) => d.kind),
    ['locked', 'locked', 'editable', 'editable', 'future', 'future', 'future']
  );
  assert.deepEqual(week.map((d) => d.done), [true, false, true, false, false, false, false]);
  assert.equal(week[3].isToday, true);
  assert.equal(week.map((d) => d.letter).join(''), 'SMTWTFS');
});

test('on a Sunday, yesterday sits in the week before', () => {
  const week = ritualWeek([], '2026-11-08');
  assert.equal(week[0].date, '2026-11-08');
  assert.deepEqual(week.map((d) => d.kind), ['editable', 'future', 'future', 'future', 'future', 'future', 'future']);
});

test('a ritual needs a name, and names stop at 40 characters', () => {
  assert.equal(RITUAL_NAME_MAX, 40);
  assert.equal(canSaveRitualName(''), false);
  assert.equal(canSaveRitualName('   '), false);
  assert.equal(canSaveRitualName(' Stretch '), true);
  assert.equal(cleanRitualName('  Stretch  '), 'Stretch');
  assert.equal(cleanRitualName('x'.repeat(45)).length, 40);
});

test('the tablet month: Sunday-first rows, only today and yesterday can change, later days wait', () => {
  const weeks = ritualMonth(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-10-31'], TODAY);
  // November 2026 starts on a Sunday and has 30 days: five rows, the last one padded.
  assert.equal(weeks.length, 5);
  assert.ok(weeks.every((w) => w.length === 7));
  assert.equal(weeks[0][0]?.date, '2026-11-01');
  assert.equal(weeks[4][1]?.day, 30);
  assert.equal(weeks[4][2], null);
  const day = (n: number) => weeks.flat().find((d) => d?.day === n)!;
  assert.deepEqual(day(4), { date: '2026-11-04', day: 4, done: true, isToday: true, kind: 'editable' });
  assert.equal(day(3).kind, 'editable');
  assert.equal(day(2).kind, 'locked');
  assert.equal(day(5).kind, 'future');
  assert.equal(day(5).done, false);
  // October's tick is not in November's month.
  assert.equal(weeks.flat().filter((d) => d?.done).length, 4);
});

test('the tablet month leaves empty cells before the first day', () => {
  // October 2026 starts on a Thursday.
  const weeks = ritualMonth([], '2026-10-15');
  assert.deepEqual(weeks[0].slice(0, 4), [null, null, null, null]);
  assert.equal(weeks[0][4]?.day, 1);
});
