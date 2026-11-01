/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DATA_VERSION } from './ritualData';
import { createRitualStorage, DATA_KEY, KeyValueStore, LEGACY_KEY, UNREADABLE_KEY } from './ritualStorageCore';

function memoryStore(initial: Record<string, string> = {}, opts: { failRead?: boolean; failWrite?: boolean } = {}) {
  const data = { ...initial };
  const store: KeyValueStore = {
    async getItem(key) {
      if (opts.failRead) throw new Error('cannot read');
      return key in data ? data[key] : null;
    },
    async setItem(key, value) {
      if (opts.failWrite) throw new Error('cannot write');
      data[key] = value;
    },
  };
  return { data, store };
}

const tea = {
  id: 'r1',
  name: 'Morning tea',
  icon: 'cup' as const,
  note: '',
  completedDates: ['2026-10-13'],
  createdAt: '2026-09-01T07:00:00.000Z',
};

test('a fresh install loads empty', async () => {
  const { store } = memoryStore();
  assert.deepEqual(await createRitualStorage(store).load(), { status: 'ok', rituals: [] });
});

test('saved rituals load back', async () => {
  const { store, data } = memoryStore();
  const storage = createRitualStorage(store);
  await storage.save([tea]);
  assert.equal(JSON.parse(data[DATA_KEY]).version, DATA_VERSION);
  assert.deepEqual(await storage.load(), { status: 'ok', rituals: [tea] });
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
    [DATA_KEY]: JSON.stringify({ version: DATA_VERSION, rituals: [tea] }),
    [LEGACY_KEY]: JSON.stringify([]),
  });
  assert.deepEqual((await createRitualStorage(store).load()).rituals, [tea]);
});

test('unreadable text is kept before the app starts empty', async () => {
  const { store, data } = memoryStore({ [DATA_KEY]: '{"version":1,"rituals":[{' });
  const result = await createRitualStorage(store).load();
  assert.deepEqual(result, { status: 'unreadable', rituals: [] });
  assert.equal(data[UNREADABLE_KEY], '{"version":1,"rituals":[{');
});

test('if the copy cannot be kept, nothing is touched and saving stays off', async () => {
  const { store } = memoryStore({ [DATA_KEY]: 'garbage' }, { failWrite: true });
  assert.deepEqual(await createRitualStorage(store).load(), { status: 'read-failed', rituals: [] });
});

test('data from a newer app is not read or changed', async () => {
  const text = JSON.stringify({ version: DATA_VERSION + 1, rituals: [tea] });
  const { store, data } = memoryStore({ [DATA_KEY]: text });
  const result = await createRitualStorage(store).load();
  assert.deepEqual(result, { status: 'newer', rituals: [] });
  assert.equal(data[DATA_KEY], text);
  assert.equal(UNREADABLE_KEY in data, false);
});

test('a storage that cannot be read is reported', async () => {
  const { store } = memoryStore({}, { failRead: true });
  assert.deepEqual(await createRitualStorage(store).load(), { status: 'read-failed', rituals: [] });
});

test('a failed write rejects, so the app can tell the person', async () => {
  const { store } = memoryStore({}, { failWrite: true });
  await assert.rejects(createRitualStorage(store).save([tea]));
});
