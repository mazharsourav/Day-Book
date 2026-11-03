import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canRotate, layoutMode } from './layoutMode';

test('phones are below 600 wide, tablets 600 to 899, wide 900 and up', () => {
  assert.equal(layoutMode(320), 'phone');
  assert.equal(layoutMode(430), 'phone');
  assert.equal(layoutMode(599), 'phone');
  assert.equal(layoutMode(600), 'tablet');
  assert.equal(layoutMode(834), 'tablet');
  assert.equal(layoutMode(899), 'tablet');
  assert.equal(layoutMode(900), 'wide');
  assert.equal(layoutMode(1194), 'wide');
});

test('only screens whose shorter side is 600 or more may turn', () => {
  assert.equal(canRotate(390, 844), false);
  assert.equal(canRotate(844, 390), false);
  assert.equal(canRotate(599, 1000), false);
  assert.equal(canRotate(600, 960), true);
  assert.equal(canRotate(834, 1194), true);
  assert.equal(canRotate(1194, 834), true);
});
