/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HAPTICS } from './haptics';

test('haptics are exactly the board short list', () => {
  assert.deepEqual(Object.keys(HAPTICS).sort(), [
    'allDone',
    'dayTap',
    'deleteConfirm',
    'drop',
    'flip',
    'passDay',
    'pickUp',
    'save',
    'tick',
  ]);
});

test('each one is a calm kind of tap', () => {
  assert.equal(HAPTICS.tick, 'light');
  assert.equal(HAPTICS.allDone, 'soft');
  assert.equal(HAPTICS.passDay, 'selection');
  assert.equal(HAPTICS.dayTap, 'selection');
  assert.equal(HAPTICS.save, 'success');
  assert.equal(HAPTICS.deleteConfirm, 'warning');
});
