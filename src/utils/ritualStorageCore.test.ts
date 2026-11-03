/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DATA_VERSION } from './ritualData';
import {
  createRitualStorage,
  DATA_KEY,
  KeyValueStore,
  LEGACY_KEY,
  taskYearKey,
  UNREADABLE_KEY,
} from './ritualStorageCore';

function memoryStore(initial: Record<string, string> = {}, opts: { failRead?: boolean; failWrite?: boolean } = {}) {
  const data = { ...initial };
  // Every batch of keys written, in order, so a test can see what a save touched.
  const writes: string[][] = [];
  const store: KeyValueStore = {
    async getItem(key) {
      if (opts.failRead) throw new Error('cannot read');
      return key in data ? data[key] : null;
    },
    async setItem(key, value) {
      if (opts.failWrite) throw new Error('cannot write');
      writes.push([key]);
      data[key] = value;
    },
    async multiSet(pairs) {
      if (opts.failWrite) throw new Error('cannot write');
      writes.push(pairs.map(([k]) => k));
      for (const [k, v] of pairs) data[k] = v;
    },
  };
  return { data, store, writes };
}

const tea = {
  id: 'r1',
  name: 'Morning tea',
  icon: 'cup' as const,
  note: '',
  completedDates: ['2026-10-13'],
  createdAt: '2026-09-01T07:00:00.000Z',
};

const bills = { id: 't1', title: 'Pay the bill', date: '2026-11-04', done: false, createdAt: '2026-11-01T09:00:00.000Z' };
const plan = { id: 't2', title: 'Plan the year', date: '2027-01-01', done: false, createdAt: '2026-12-20T09:00:00.000Z' };

const EMPTY = { status: 'ok', rituals: [], tasks: [] };

test('a fresh install loads empty', async () => {
  const { store } = memoryStore();
  assert.deepEqual(await createRitualStorage(store).load(), EMPTY);
});

test('rituals and tasks over two years save in one batch and load back', async () => {
  const { store, data, writes } = memoryStore();
  const storage = createRitualStorage(store);
  await storage.save({ rituals: [tea], tasks: [bills, plan] });
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].sort(), [DATA_KEY, taskYearKey('2026'), taskYearKey('2027')].sort());
  assert.equal(JSON.parse(data[DATA_KEY]).version, DATA_VERSION);
  assert.deepEqual(await createRitualStorage(store).load(), { status: 'ok', rituals: [tea], tasks: [bills, plan] });
});

test('a save rewrites only what changed', async () => {
  const { store, writes } = memoryStore();
  const storage = createRitualStorage(store);
  await storage.save({ rituals: [tea], tasks: [bills, plan] });
  // Tick the 2027 task: only that year is written.
  await storage.save({ rituals: [tea], tasks: [bills, { ...plan, done: true }] });
  assert.deepEqual(writes[1], [taskYearKey('2027')]);
  // Nothing changed: nothing is written.
  await storage.save({ rituals: [tea], tasks: [bills, { ...plan, done: true }] });
  assert.equal(writes.length, 2);
});

test('a year whose last task is deleted is emptied, and drops out of the list', async () => {
  const { store, data } = memoryStore();
  const storage = createRitualStorage(store);
  await storage.save({ rituals: [tea], tasks: [bills, plan] });
  await storage.save({ rituals: [tea], tasks: [bills] });
  assert.deepEqual(JSON.parse(data[DATA_KEY]).taskYears, ['2026']);
  assert.deepEqual(JSON.parse(data[taskYearKey('2027')]).tasks, []);
  assert.deepEqual((await createRitualStorage(store).load()).tasks, [bills]);
});

test('after loading, an unchanged save writes nothing', async () => {
  const { store, writes } = memoryStore();
  await createRitualStorage(store).save({ rituals: [tea], tasks: [bills] });
  const storage = createRitualStorage(store);
  const loaded = await storage.load();
  await storage.save({ rituals: loaded.rituals, tasks: loaded.tasks });
  assert.equal(writes.length, 1);
});

test('a 1.0.0 save on the phone loads with nothing lost, and the first save moves it to version 2', async () => {
  const { store, data } = memoryStore({ [DATA_KEY]: JSON.stringify({ version: 1, rituals: [tea] }) });
  const storage = createRitualStorage(store);
  const loaded = await storage.load();
  assert.deepEqual(loaded, { status: 'ok', rituals: [tea], tasks: [] });
  await storage.save({ rituals: loaded.rituals, tasks: [] });
  assert.equal(JSON.parse(data[DATA_KEY]).version, DATA_VERSION);
});

test('first saves under the old key are found, and left in place', async () => {
  const { store, data } = memoryStore({ [LEGACY_KEY]: JSON.stringify([{ ...tea, icon: '🍵' }]) });
  const result = await createRitualStorage(store).load();
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.rituals, [tea]);
  assert.ok(LEGACY_KEY in data);
});

test('the current key wins over the old one', async () => {
  const { store } = memoryStore({
    [DATA_KEY]: JSON.stringify({ version: DATA_VERSION, rituals: [tea], taskYears: [] }),
    [LEGACY_KEY]: JSON.stringify([]),
  });
  assert.deepEqual((await createRitualStorage(store).load()).rituals, [tea]);
});

test('unreadable text is kept before the app starts empty', async () => {
  const { store, data } = memoryStore({ [DATA_KEY]: '{"version":1,"rituals":[{' });
  const result = await createRitualStorage(store).load();
  assert.deepEqual(result, { status: 'unreadable', rituals: [], tasks: [] });
  assert.equal(data[UNREADABLE_KEY], '{"version":1,"rituals":[{');
});

test('if the copy cannot be kept, nothing is touched and saving stays off', async () => {
  const { store } = memoryStore({ [DATA_KEY]: 'garbage' }, { failWrite: true });
  assert.deepEqual(await createRitualStorage(store).load(), { status: 'read-failed', rituals: [], tasks: [] });
});

test('a year of tasks that cannot be read stops the load, so nothing is saved over it', async () => {
  const main = JSON.stringify({ version: 2, rituals: [tea], taskYears: ['2026'] });
  const { store, data } = memoryStore({ [DATA_KEY]: main, [taskYearKey('2026')]: '{"version":2,"tasks":[' });
  assert.deepEqual(await createRitualStorage(store).load(), { status: 'read-failed', rituals: [], tasks: [] });
  assert.equal(data[taskYearKey('2026')], '{"version":2,"tasks":[');
});

test('a listed year that is missing also stops the load', async () => {
  const main = JSON.stringify({ version: 2, rituals: [tea], taskYears: ['2026'] });
  const { store } = memoryStore({ [DATA_KEY]: main });
  assert.equal((await createRitualStorage(store).load()).status, 'read-failed');
});

test('data from a newer app is not read or changed', async () => {
  const text = JSON.stringify({ version: DATA_VERSION + 1, rituals: [tea] });
  const { store, data } = memoryStore({ [DATA_KEY]: text });
  const result = await createRitualStorage(store).load();
  assert.deepEqual(result, { status: 'newer', rituals: [], tasks: [] });
  assert.equal(data[DATA_KEY], text);
  assert.equal(UNREADABLE_KEY in data, false);
});

test('a year of tasks from a newer app is not read', async () => {
  const main = JSON.stringify({ version: 2, rituals: [tea], taskYears: ['2026'] });
  const year = JSON.stringify({ version: DATA_VERSION + 1, year: '2026', tasks: [] });
  const { store } = memoryStore({ [DATA_KEY]: main, [taskYearKey('2026')]: year });
  assert.equal((await createRitualStorage(store).load()).status, 'newer');
});

test('a storage that cannot be read is reported', async () => {
  const { store } = memoryStore({}, { failRead: true });
  assert.deepEqual(await createRitualStorage(store).load(), { status: 'read-failed', rituals: [], tasks: [] });
});

test('a failed write rejects, and the next save tries everything again', async () => {
  const failing = memoryStore({}, { failWrite: true });
  await assert.rejects(createRitualStorage(failing.store).save({ rituals: [tea], tasks: [] }));

  // Same storage object: after a failure nothing counts as written, so a retry writes it all.
  const { store, writes } = memoryStore();
  let fail = true;
  const flaky: KeyValueStore = {
    ...store,
    async multiSet(pairs) {
      if (fail) throw new Error('cannot write');
      return store.multiSet(pairs);
    },
  };
  const storage = createRitualStorage(flaky);
  await assert.rejects(storage.save({ rituals: [tea], tasks: [bills] }));
  fail = false;
  await storage.save({ rituals: [tea], tasks: [bills] });
  assert.deepEqual(writes[0].sort(), [DATA_KEY, taskYearKey('2026')].sort());
});
