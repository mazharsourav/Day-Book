/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COPY, restoreQuestion, restoreSummary } from '../constants/copy';
import { backupFileName, buildBackup, parseBackup } from './backup';
import { DATA_VERSION, savedTexts } from './ritualData';

const NOW = new Date('2026-10-13T08:00:00.000Z');

const reading = {
  id: 'r2',
  name: 'Reading',
  icon: 'book' as const,
  note: '',
  completedDates: ['2026-10-13', '2026-10-11'],
  createdAt: '2026-08-20T20:00:00.000Z',
};

const groceries = { id: 't1', title: 'Buy groceries', date: '2026-11-04', done: true, createdAt: '2026-11-01T09:00:00.000Z' };

test('a backup restores exactly what was exported, tasks included', () => {
  const text = buildBackup({ rituals: [reading], tasks: [groceries] }, NOW);
  assert.equal(JSON.parse(text).version, DATA_VERSION);
  const result = parseBackup(text, NOW);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.rituals, [reading]);
  assert.deepEqual(result.tasks, [groceries]);
  assert.equal(result.exportedAt, NOW.toISOString());
  assert.equal(result.dropped, 0);
});

test('a 1.0.0 backup file still restores, with no tasks', () => {
  const old = JSON.stringify({ app: 'daybook', version: 1, exportedAt: NOW.toISOString(), rituals: [reading] });
  const result = parseBackup(old, NOW);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.rituals, [reading]);
  assert.deepEqual(result.tasks, []);
});

test('an empty app backs up and restores as empty', () => {
  const result = parseBackup(buildBackup({ rituals: [], tasks: [] }, NOW), NOW);
  assert.equal(result.ok && result.rituals.length + result.tasks.length, 0);
});

test('the restore question says what the backup holds and what Day Book holds now', () => {
  assert.equal(
    restoreQuestion({ rituals: 5, tasks: 14 }, '12 October 2026', { rituals: 5, tasks: 9 }),
    'This backup has 5 rituals and 14 tasks, saved on 12 October 2026. Day Book has 5 rituals and 9 tasks now. Restoring replaces them.'
  );
  // An old file has no tasks, and the question says so.
  assert.equal(
    restoreQuestion({ rituals: 1, tasks: 0 }, '3 May 2026', { rituals: 2, tasks: 1 }),
    'This backup has 1 ritual and no tasks, saved on 3 May 2026. Day Book has 2 rituals and 1 task now. Restoring replaces them.'
  );
  assert.equal(COPY.restore.title, 'Replace your data?');
  assert.equal(COPY.restore.keep, 'Keep current data');
  assert.equal(COPY.restore.replace, 'Replace with backup');
});

test('the line after a restore counts rituals and tasks', () => {
  assert.equal(restoreSummary(5, 14, 0), 'Restored 5 rituals and 14 tasks.');
  assert.equal(restoreSummary(1, 0, 0), 'Restored 1 ritual and no tasks.');
  assert.equal(restoreSummary(5, 1, 2), 'Restored 5 rituals and 1 task. 2 damaged entries were skipped.');
  assert.equal(restoreSummary(5, 1, 1), 'Restored 5 rituals and 1 task. 1 damaged entry was skipped.');
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
  assert.deepEqual(parseBackup(savedTexts({ rituals: [reading], tasks: [] }).main, NOW), { ok: false, reason: 'not-backup' });
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
