/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DATA_VERSION, parseSaved, parseTaskYear, sanitizeRituals, sanitizeTasks, savedTexts } from './ritualData';

const NOW = new Date('2026-10-13T08:00:00.000Z');

const tea = {
  id: 'r1',
  name: 'Morning tea',
  icon: 'cup',
  note: 'Green, no sugar',
  completedDates: ['2026-10-12', '2026-10-13'],
  createdAt: '2026-09-01T07:00:00.000Z',
};

const bills = { id: 't1', title: 'Pay the electricity bill', date: '2026-11-04', done: false, createdAt: '2026-11-01T09:00:00.000Z' };
const newYear = { id: 't2', title: 'Plan the year', date: '2027-01-01', done: true, createdAt: '2026-12-20T09:00:00.000Z' };

// Android cannot read back one saved value over 2 MB, so rituals and each year's tasks are saved apart.
test('saved data is version 2: rituals in one text, each year of tasks in its own', () => {
  assert.equal(DATA_VERSION, 2);
  const { main, years } = savedTexts({ rituals: [tea as never], tasks: [newYear, bills] });
  const saved = JSON.parse(main);
  assert.deepEqual(Object.keys(saved), ['version', 'rituals', 'taskYears']);
  assert.deepEqual(saved.taskYears, ['2026', '2027']);
  assert.deepEqual(Object.keys(years), ['2026', '2027']);
  assert.deepEqual(JSON.parse(years['2026']), { version: 2, year: '2026', tasks: [bills] });
});

test('rituals and tasks round-trip unchanged', () => {
  const { main, years } = savedTexts({ rituals: [tea as never], tasks: [bills, newYear] });
  const parsed = parseSaved(main, NOW);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.rituals, [tea]);
  assert.deepEqual(parsed.taskYears, ['2026', '2027']);
  assert.equal(parsed.dropped, 0);
  assert.equal(parsed.fromVersion, DATA_VERSION);
  const y2026 = parseTaskYear(years['2026'], NOW);
  assert.deepEqual(y2026, { ok: true, tasks: [bills], dropped: 0 });
});

test('a day keeps its order of tasks when saved by year', () => {
  const a = { ...bills, id: 'a' };
  const b = { ...bills, id: 'b' };
  const { years } = savedTexts({ rituals: [], tasks: [b, newYear, a] });
  const back = parseTaskYear(years['2026'], NOW);
  assert.deepEqual(back.ok && back.tasks.map((t) => t.id), ['b', 'a']);
});

test('no tasks means no year texts', () => {
  const { main, years } = savedTexts({ rituals: [tea as never], tasks: [] });
  assert.deepEqual(JSON.parse(main).taskYears, []);
  assert.deepEqual(years, {});
});

test('a 1.0.0 save (version 1) loads with every ritual and no task years', () => {
  const parsed = parseSaved(JSON.stringify({ version: 1, rituals: [tea] }), NOW);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.fromVersion, 1);
  assert.deepEqual(parsed.rituals, [tea]);
  assert.deepEqual(parsed.taskYears, []);
});

test('a version 2 save with its year list missing still loads the rituals', () => {
  const parsed = parseSaved(JSON.stringify({ version: 2, rituals: [tea] }), NOW);
  assert.equal(parsed.ok && parsed.taskYears.length, 0);
  assert.equal(parsed.ok && parsed.rituals.length, 1);
});

test('a year of tasks that cannot be read, or is from a newer app, is refused', () => {
  assert.deepEqual(parseTaskYear('{"version":2,"tasks":[', NOW), { ok: false, reason: 'corrupt' });
  assert.deepEqual(parseTaskYear('{"version":2}', NOW), { ok: false, reason: 'corrupt' });
  assert.deepEqual(parseTaskYear(JSON.stringify({ version: 3, year: '2026', tasks: [] }), NOW), { ok: false, reason: 'newer' });
});

test('tasks that are not tasks are dropped and counted', () => {
  const { tasks, dropped } = sanitizeTasks(
    [bills, null, { ...bills }, { id: 't2', title: '', date: '2026-11-04' }, { id: 't3', title: 'x', date: 'soon' }, { id: 't4', title: 'Ok', date: '2026-11-05' }],
    NOW
  );
  assert.deepEqual(tasks.map((t) => t.id), ['t1', 't4']);
  assert.equal(dropped, 4);
  const year = parseTaskYear(JSON.stringify({ version: 2, year: '2026', tasks: [bills, 7] }), NOW);
  assert.equal(year.ok && year.dropped, 1);
});

test('bad task fields are repaired', () => {
  const { tasks } = sanitizeTasks([{ id: 't5', title: '  ' + 'y'.repeat(70), date: '2026-11-05', done: 'yes', createdAt: 'later' }], NOW);
  assert.deepEqual(tasks[0], { id: 't5', title: 'y'.repeat(60), date: '2026-11-05', done: false, createdAt: NOW.toISOString() });
});

test('ten years of heavy use: every saved text stays well under what the phone can read back', () => {
  // Eight rituals ticked every day, and five tasks a day (about 1,800 a year), for ten years.
  const days = Array.from({ length: 3650 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10));
  const rituals = Array.from({ length: 8 }, (_, r) => ({ ...tea, id: `r${r}`, completedDates: days }));
  const tasks = days.flatMap((date, d) =>
    Array.from({ length: 5 }, (_, k) => ({
      id: `t${1767225600000 + d * 5 + k}`,
      title: 'Pay the electricity bill and call the plumber',
      date,
      done: k % 2 === 0,
      createdAt: `${date}T08:00:00.000Z`,
    }))
  );
  const { main, years } = savedTexts({ rituals: rituals as never, tasks });
  const texts = [main, ...Object.values(years)];
  const largest = Math.max(...texts.map((t) => t.length));
  // Android reads one saved value through a 2 MB window. Keep every text under a quarter of that.
  assert.ok(largest < 0.5 * 1024 * 1024, `${(largest / 1024 / 1024).toFixed(2)} MB`);
  const parsed = parseSaved(main, NOW);
  assert.equal(parsed.ok && parsed.rituals[0].completedDates.length, 3650);
  const all = Object.values(years).flatMap((t) => {
    const y = parseTaskYear(t, NOW);
    return y.ok ? y.tasks : [];
  });
  assert.equal(all.length, 18250);
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
  const parsed = parseSaved(savedTexts({ rituals: [], tasks: [] }).main, NOW);
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
