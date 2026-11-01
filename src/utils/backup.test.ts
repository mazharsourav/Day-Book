/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { backupFileName, buildBackup, parseBackup } from './backup';
import { DATA_VERSION, serializeSaved } from './ritualData';

const NOW = new Date('2026-10-13T08:00:00.000Z');

const reading = {
  id: 'r2',
  name: 'Reading',
  icon: 'book' as const,
  note: '',
  completedDates: ['2026-10-13', '2026-10-11'],
  createdAt: '2026-08-20T20:00:00.000Z',
};

test('a backup restores exactly what was exported', () => {
  const result = parseBackup(buildBackup([reading], NOW), NOW);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.rituals, [reading]);
  assert.equal(result.exportedAt, NOW.toISOString());
  assert.equal(result.dropped, 0);
});

test('an empty app backs up and restores as empty', () => {
  const result = parseBackup(buildBackup([], NOW), NOW);
  assert.equal(result.ok && result.rituals.length, 0);
});

test('text that is not JSON is unreadable', () => {
  assert.deepEqual(parseBackup('not a file', NOW), { ok: false, reason: 'unreadable' });
});

test('other JSON files are not a backup', () => {
  assert.deepEqual(parseBackup('{"name":"package","version":1}', NOW), { ok: false, reason: 'not-backup' });
  assert.deepEqual(parseBackup('[]', NOW), { ok: false, reason: 'not-backup' });
  assert.deepEqual(parseBackup('7', NOW), { ok: false, reason: 'not-backup' });
});

test('the phone save format is not accepted as a backup file', () => {
  assert.deepEqual(parseBackup(serializeSaved([reading]), NOW), { ok: false, reason: 'not-backup' });
});

test('a backup from a newer app version is refused', () => {
  const text = JSON.stringify({ app: 'daybook', version: DATA_VERSION + 1, rituals: [] });
  assert.deepEqual(parseBackup(text, NOW), { ok: false, reason: 'newer' });
});

test('broken entries are dropped and counted, the rest restore', () => {
  const text = JSON.stringify({ app: 'daybook', version: DATA_VERSION, rituals: [reading, { nope: 1 }] });
  const result = parseBackup(text, NOW);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.rituals.length, 1);
  assert.equal(result.dropped, 1);
  assert.equal(result.exportedAt, null);
});

test('the file name carries the local date', () => {
  assert.equal(backupFileName(new Date(2026, 9, 3, 23, 30)), 'daybook-backup-2026-10-03.json');
});
