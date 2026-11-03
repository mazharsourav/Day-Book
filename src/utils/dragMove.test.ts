/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARROW_HOLD_MS,
  ARROW_REPEAT_MS,
  arrowFlips,
  boardTarget,
  DragLayout,
  dropMeaning,
  dropTarget,
  LONG_PRESS_MS,
} from './dragMove';

// A strip 388 wide with 12 on each side, so each of the 7 days gets exactly 52.
const LAYOUT: DragLayout = {
  strip: { x: 0, y: 160, width: 388, height: 80 },
  stripPad: 12,
  prev: { x: 8, y: 110, width: 44, height: 44 },
  next: { x: 338, y: 110, width: 44, height: 44 },
};
const mid = (i: number) => 12 + 52 * i + 26;

test('the finger over each day picks that day', () => {
  for (let i = 0; i < 7; i++) assert.deepEqual(dropTarget(mid(i), 200, LAYOUT), { kind: 'day', index: i });
});

test('the edges of the strip belong to the first and last day', () => {
  assert.deepEqual(dropTarget(0, 200, LAYOUT), { kind: 'day', index: 0 });
  assert.deepEqual(dropTarget(388, 200, LAYOUT), { kind: 'day', index: 6 });
  // Between two days the line falls halfway.
  assert.deepEqual(dropTarget(12 + 52 - 1, 200, LAYOUT), { kind: 'day', index: 0 });
  assert.deepEqual(dropTarget(12 + 52, 200, LAYOUT), { kind: 'day', index: 1 });
});

test('a little above or below the strip still counts, further away does not', () => {
  assert.deepEqual(dropTarget(mid(3), 160 - 10, LAYOUT), { kind: 'day', index: 3 });
  assert.deepEqual(dropTarget(mid(3), 240 + 10, LAYOUT), { kind: 'day', index: 3 });
  assert.equal(dropTarget(mid(3), 240 + 40, LAYOUT), null);
  assert.equal(dropTarget(mid(3), 400, LAYOUT), null);
});

test('the week arrows, with a little room around them', () => {
  assert.deepEqual(dropTarget(30, 132, LAYOUT), { kind: 'prev' });
  assert.deepEqual(dropTarget(360, 132, LAYOUT), { kind: 'next' });
  assert.deepEqual(dropTarget(334, 106, LAYOUT), { kind: 'next' });
  // Between the arrows (the week's dates) is nothing.
  assert.equal(dropTarget(195, 132, LAYOUT), null);
});

// The week of Sunday 1 to Saturday 7 November 2026; today is Wednesday 4.
const WEEK = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'];
const TODAY = '2026-11-04';

test('over another day that is not past: a move to it', () => {
  assert.deepEqual(dropMeaning({ kind: 'day', index: 4 }, WEEK, '2026-11-04', TODAY), { kind: 'move', date: '2026-11-05' });
  assert.deepEqual(dropMeaning({ kind: 'day', index: 3 }, WEEK, '2026-11-06', TODAY), { kind: 'move', date: '2026-11-04' });
});

test('over a past day: refused, read only', () => {
  assert.deepEqual(dropMeaning({ kind: 'day', index: 1 }, WEEK, '2026-11-05', TODAY), { kind: 'refuse', date: '2026-11-02' });
});

test('over its own day, or nothing: no move', () => {
  assert.equal(dropMeaning({ kind: 'day', index: 4 }, WEEK, '2026-11-05', TODAY), null);
  assert.equal(dropMeaning(null, WEEK, '2026-11-05', TODAY), null);
});

test('over an arrow: hold to flip the week', () => {
  assert.deepEqual(dropMeaning({ kind: 'next' }, WEEK, '2026-11-05', TODAY), { kind: 'arrow', weeks: 1 });
  assert.deepEqual(dropMeaning({ kind: 'prev' }, WEEK, '2026-11-05', TODAY), { kind: 'arrow', weeks: -1 });
});

test('holding on an arrow flips the week after a moment, then again while held', () => {
  assert.equal(arrowFlips(0), 0);
  assert.equal(arrowFlips(ARROW_HOLD_MS - 1), 0);
  assert.equal(arrowFlips(ARROW_HOLD_MS), 1);
  assert.equal(arrowFlips(ARROW_HOLD_MS + ARROW_REPEAT_MS - 1), 1);
  assert.equal(arrowFlips(ARROW_HOLD_MS + ARROW_REPEAT_MS), 2);
  assert.equal(arrowFlips(ARROW_HOLD_MS + 3 * ARROW_REPEAT_MS), 4);
});

test('the timings are calm: a press of 400 ms lifts, a hold of 600 ms flips', () => {
  assert.equal(LONG_PRESS_MS, 400);
  assert.equal(ARROW_HOLD_MS, 600);
  assert.ok(ARROW_REPEAT_MS >= ARROW_HOLD_MS);
});

// A tablet board: 14 padding, columns of 100 with gaps of 4, so column i starts at 14 + 104 i.
const BOARD = {
  grid: { x: 0, y: 120, width: 752, height: 600 },
  pad: 14,
  gap: 4,
  prev: { x: 560, y: 40, width: 44, height: 44 },
  next: { x: 700, y: 40, width: 44, height: 44 },
};

test('on the tablet board a task drops onto a column, anywhere along its height', () => {
  assert.deepEqual(boardTarget(64, 130, BOARD), { kind: 'day', index: 0 });
  assert.deepEqual(boardTarget(584, 700, BOARD), { kind: 'day', index: 5 });
  assert.deepEqual(boardTarget(740, 400, BOARD), { kind: 'day', index: 6 });
});

test('the gap between two columns is split between them', () => {
  assert.deepEqual(boardTarget(115, 300, BOARD), { kind: 'day', index: 0 });
  assert.deepEqual(boardTarget(116, 300, BOARD), { kind: 'day', index: 1 });
});

test('the board arrows win over the columns, and outside the board is nothing', () => {
  assert.deepEqual(boardTarget(580, 60, BOARD), { kind: 'prev' });
  assert.deepEqual(boardTarget(720, 60, BOARD), { kind: 'next' });
  assert.equal(boardTarget(300, 20, BOARD), null);
  assert.equal(boardTarget(300, 760, BOARD), null);
  assert.equal(boardTarget(760, 300, BOARD), null);
});
