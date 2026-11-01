/// <reference types="node" />
import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { createSaver } from './saver';

afterEach(() => mock.timers.reset());

function setup(failures: number[] = []) {
  const written: string[] = [];
  const results: boolean[] = [];
  let call = 0;
  const saver = createSaver<string>(
    async (data) => {
      const n = call++;
      if (failures.includes(n)) throw new Error('disk full');
      written.push(data);
    },
    (ok) => results.push(ok)
  );
  return { saver, written, results };
}

test('a zero delay saves straight away', async () => {
  const { saver, written } = setup();
  saver.schedule('a', 0);
  await saver.flush();
  assert.deepEqual(written, ['a']);
});

test('quick changes wait, and only the latest is saved', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const { saver, written } = setup();
  saver.schedule('h', 600);
  mock.timers.tick(300);
  saver.schedule('he', 600);
  mock.timers.tick(300);
  saver.schedule('hey', 600);
  assert.deepEqual(written, []);
  mock.timers.tick(600);
  await saver.flush();
  assert.deepEqual(written, ['hey']);
});

test('flush saves waiting data now, and the timer does not save it twice', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const { saver, written } = setup();
  saver.schedule('note', 600);
  await saver.flush();
  assert.deepEqual(written, ['note']);
  mock.timers.tick(1000);
  await saver.flush();
  assert.deepEqual(written, ['note']);
});

test('flush with nothing waiting writes nothing', async () => {
  const { saver, written } = setup();
  await saver.flush();
  assert.deepEqual(written, []);
});

test('an immediate change after a waiting note saves the newest data last', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const { saver, written } = setup();
  saver.schedule('note typed', 600);
  saver.schedule('note typed + tick', 0);
  await saver.flush();
  mock.timers.tick(1000);
  await saver.flush();
  assert.deepEqual(written, ['note typed + tick']);
});

test('a failed save is reported, and retry saves the latest data', async () => {
  const { saver, written, results } = setup([0]);
  saver.schedule('a', 0);
  await saver.flush();
  assert.deepEqual(results, [false]);
  assert.deepEqual(written, []);
  await saver.retry();
  assert.deepEqual(results, [false, true]);
  assert.deepEqual(written, ['a']);
});

test('retry with nothing ever saved does nothing', async () => {
  const { saver, written, results } = setup();
  await saver.retry();
  assert.deepEqual(written, []);
  assert.deepEqual(results, []);
});

test('saves happen in the order they were asked', async () => {
  const { saver, written } = setup();
  saver.schedule('one', 0);
  saver.schedule('two', 0);
  saver.schedule('three', 0);
  await saver.flush();
  assert.deepEqual(written, ['one', 'two', 'three']);
});
