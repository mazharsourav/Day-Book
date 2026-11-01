/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DATA_VERSION, parseSaved, sanitizeRituals, serializeSaved } from './ritualData';

const NOW = new Date('2026-10-13T08:00:00.000Z');

const tea = {
  id: 'r1',
  name: 'Morning tea',
  icon: 'cup',
  note: 'Green, no sugar',
  completedDates: ['2026-10-12', '2026-10-13'],
  createdAt: '2026-09-01T07:00:00.000Z',
};

test('a saved list round-trips unchanged', () => {
  const parsed = parseSaved(serializeSaved([tea as never]), NOW);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.rituals, [tea]);
  assert.equal(parsed.dropped, 0);
  assert.equal(parsed.fromVersion, DATA_VERSION);
});

test('first saves (a bare array, no version) still load', () => {
  const old = { ...tea, icon: '🍵', durationMinutes: 10 };
  const parsed = parseSaved(JSON.stringify([old]), NOW);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.fromVersion, 0);
  assert.equal(parsed.rituals[0].icon, 'cup');
  assert.equal('durationMinutes' in parsed.rituals[0], false);
});

test('data from a newer version is refused, not read', () => {
  const parsed = parseSaved(JSON.stringify({ version: DATA_VERSION + 1, rituals: [tea] }), NOW);
  assert.deepEqual(parsed, { ok: false, reason: 'newer' });
});

test('text that is not JSON is corrupt', () => {
  assert.deepEqual(parseSaved('{"version":1,"rituals":[', NOW), { ok: false, reason: 'corrupt' });
  assert.deepEqual(parseSaved('', NOW), { ok: false, reason: 'corrupt' });
});

test('JSON of the wrong shape is corrupt', () => {
  assert.deepEqual(parseSaved('"hello"', NOW), { ok: false, reason: 'corrupt' });
  assert.deepEqual(parseSaved('{"foo":1}', NOW), { ok: false, reason: 'corrupt' });
  assert.deepEqual(parseSaved('{"version":1,"rituals":"x"}', NOW), { ok: false, reason: 'corrupt' });
  assert.deepEqual(parseSaved('null', NOW), { ok: false, reason: 'corrupt' });
});

test('an empty list is valid', () => {
  const parsed = parseSaved(serializeSaved([]), NOW);
  assert.equal(parsed.ok && parsed.rituals.length, 0);
});

test('items that are not rituals are dropped and counted', () => {
  const { rituals, dropped } = sanitizeRituals([tea, null, 'x', 5, { name: 'no id' }, { id: '' }], NOW);
  assert.equal(rituals.length, 1);
  assert.equal(dropped, 5);
});

test('a repeated id keeps the first ritual only', () => {
  const { rituals, dropped } = sanitizeRituals([tea, { ...tea, name: 'Copy' }], NOW);
  assert.equal(rituals.length, 1);
  assert.equal(rituals[0].name, 'Morning tea');
  assert.equal(dropped, 1);
});

test('bad fields are repaired rather than crashing a screen', () => {
  const { rituals } = sanitizeRituals(
    [{ id: 'x', name: 7, icon: 'rocket', note: null, completedDates: 'no', createdAt: 'yesterday' }],
    NOW
  );
  assert.deepEqual(rituals[0], {
    id: 'x',
    name: '',
    icon: 'dot',
    note: '',
    completedDates: [],
    createdAt: NOW.toISOString(),
  });
});

test('completed dates keep only real date strings, once each', () => {
  const { rituals } = sanitizeRituals(
    [{ ...tea, completedDates: ['2026-10-13', '2026-10-13', 'today', 20261013, '2026-10-12'] }],
    NOW
  );
  assert.deepEqual(rituals[0].completedDates, ['2026-10-13', '2026-10-12']);
});

test('input that is not a list gives nothing', () => {
  assert.deepEqual(sanitizeRituals({ id: 'a' }, NOW), { rituals: [], dropped: 0 });
});
