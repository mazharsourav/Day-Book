/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeIcon, PICKER_ICONS } from './iconKeys';

test('known keys pass through', () => {
  for (const key of PICKER_ICONS) assert.equal(normalizeIcon(key), key);
  assert.equal(normalizeIcon('dot'), 'dot');
});

test('old emoji saves map to the new keys', () => {
  assert.equal(normalizeIcon('🕯️'), 'flame');
  assert.equal(normalizeIcon('🕯'), 'flame');
  assert.equal(normalizeIcon('🌿'), 'leaf');
  assert.equal(normalizeIcon('📖'), 'book');
  assert.equal(normalizeIcon('🌸'), 'flower');
  assert.equal(normalizeIcon('🍵'), 'cup');
  assert.equal(normalizeIcon('🌙'), 'moon');
});

test('anything unknown falls back to dot', () => {
  assert.equal(normalizeIcon('🚀'), 'dot');
  assert.equal(normalizeIcon(''), 'dot');
  assert.equal(normalizeIcon(undefined), 'dot');
  assert.equal(normalizeIcon(null), 'dot');
  assert.equal(normalizeIcon(42), 'dot');
  assert.equal(normalizeIcon({}), 'dot');
});

test('object prototype names are not treated as icons', () => {
  assert.equal(normalizeIcon('constructor'), 'dot');
  assert.equal(normalizeIcon('toString'), 'dot');
  assert.equal(normalizeIcon('__proto__'), 'dot');
});

test('the picker offers 18 unique icons', () => {
  assert.equal(PICKER_ICONS.length, 18);
  assert.equal(new Set(PICKER_ICONS).size, 18);
});