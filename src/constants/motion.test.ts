/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MOTION, SPEED, UNDO_MS, undoDuration } from './motion';

test('only three speeds, as on the board', () => {
  assert.deepEqual(SPEED, { fast: 150, medium: 220, slow: 320 });
});

test('every animation on the motion table uses one of the speeds and stays under 400 ms', () => {
  const allowed = new Set<number>([SPEED.fast, SPEED.medium, SPEED.slow]);
  for (const [name, ms] of Object.entries(MOTION)) {
    assert.ok(allowed.has(ms), `${name} uses ${ms} ms`);
    assert.ok(ms <= 400, `${name} is longer than 400 ms`);
  }
});

test('the motion table lists the board rows', () => {
  for (const key of [
    'tickFill', 'tickCheck', 'tickBar', 'untick', 'allDoneWords', 'tabFade', 'badgePop',
    'screenPush', 'sheet', 'dayPick', 'dayListFade', 'weekChange', 'moveLift', 'moveLight',
    'moveSettle', 'deleteFold', 'switchThumb', 'themeFade', 'shareCard', 'noticeIn', 'noticeOut',
  ]) {
    assert.ok(key in MOTION, key);
  }
});

test('undo notes stay 5 seconds, or longer if the phone asks for more time', () => {
  assert.equal(UNDO_MS, 5000);
  assert.equal(undoDuration(undefined), 5000);
  assert.equal(undoDuration(3000), 5000);
  assert.equal(undoDuration(10000), 10000);
});
