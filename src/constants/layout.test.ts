/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hitSlopFor, LAYOUT, TOUCH } from './layout';

test('the touch area is at least 48', () => {
  assert.ok(TOUCH >= 48);
});

test('hitSlopFor grows a small drawing to the touch area', () => {
  assert.deepEqual(hitSlopFor(30), { top: 9, bottom: 9, left: 9, right: 9 });
  assert.deepEqual(hitSlopFor(24), { top: 12, bottom: 12, left: 12, right: 12 });
  assert.deepEqual(hitSlopFor(54), { top: 0, bottom: 0, left: 0, right: 0 });
  assert.deepEqual(hitSlopFor(30, 44), { top: 7, bottom: 7, left: 7, right: 7 });
  assert.deepEqual(hitSlopFor(19, 44), { top: 13, bottom: 13, left: 13, right: 13 });
});

test('main sizes are the board numbers', () => {
  assert.equal(LAYOUT.screenPadding, 20);
  assert.equal(LAYOUT.rowMinHeight, 66);
  assert.equal(LAYOUT.tick, 30);
  assert.equal(LAYOUT.barHeight, 6);
  assert.equal(LAYOUT.buttonHeight, 54);
  assert.equal(LAYOUT.dayCircle, 40);
  assert.equal(LAYOUT.switchWidth, 51);
  assert.equal(LAYOUT.switchHeight, 31);
});
