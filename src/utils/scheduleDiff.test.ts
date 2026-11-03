/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PlannedReminder } from './reminderPlan';
import { diffSchedule, noteData, ScheduledNote } from './scheduleDiff';

const NOW = new Date(2026, 10, 3, 21, 32); // Tuesday 3 November, 9:32 PM

const planned = (kind: 'evening' | 'morning', day: string, h: number, m: number, title = 'T', body = 'B'): PlannedReminder => {
  const [y, mo, d] = day.split('-').map(Number);
  return { kind, day, date: new Date(y, mo - 1, d, h, m), title, body };
};
const onPhone = (id: string, p: PlannedReminder): ScheduledNote => ({ id, title: p.title, body: p.body, data: noteData(p) });
const always = () => true;

test('a note already on the phone and still in the plan is left alone', () => {
  const p = planned('evening', '2026-11-04', 21, 28);
  const r = diffSchedule([onPhone('a', p)], [p], NOW, always);
  assert.deepEqual(r, { cancel: [], add: [] });
});

test('a note no longer in the plan is cancelled, and a new one is added', () => {
  const old = planned('evening', '2026-11-04', 21, 28);
  const next = planned('evening', '2026-11-04', 21, 45);
  const r = diffSchedule([onPhone('a', old)], [next], NOW, always);
  assert.deepEqual(r.cancel, ['a']);
  assert.deepEqual(r.add, [next]);
});

test('changed words count as a different note', () => {
  const old = planned('morning', '2026-11-04', 8, 0, 'You have 1 task today');
  const next = planned('morning', '2026-11-04', 8, 0, 'You have 2 tasks today');
  assert.deepEqual(diffSchedule([onPhone('a', old)], [next], NOW, always), { cancel: ['a'], add: [next] });
});

test("a note for today that is due but not shown yet (Android running late) is kept, not cancelled", () => {
  // The 9:30 note, still waiting at 9:32. The new plan no longer has it, because 9:30 has passed.
  const late = planned('morning', '2026-11-03', 21, 30);
  const r = diffSchedule([onPhone('late', late)], [], NOW, always);
  assert.deepEqual(r.cancel, []);
});

test('a late note is cancelled when it has nothing left to say, or is from an earlier day', () => {
  const late = planned('morning', '2026-11-03', 21, 30);
  assert.deepEqual(diffSchedule([onPhone('late', late)], [], NOW, () => false).cancel, ['late']);
  const yesterday = planned('evening', '2026-11-02', 21, 0);
  assert.deepEqual(diffSchedule([onPhone('old', yesterday)], [], NOW, always).cancel, ['old']);
});

test('notes without Day Book data (from 1.0.0) are cancelled and planned again', () => {
  const p = planned('evening', '2026-11-04', 20, 0);
  const r = diffSchedule([{ id: 'v1', title: p.title, body: p.body, data: {} }], [p], NOW, always);
  assert.deepEqual(r, { cancel: ['v1'], add: [p] });
});

test('a planned time that passed while planning is not added', () => {
  const passed = planned('evening', '2026-11-03', 21, 31);
  assert.deepEqual(diffSchedule([], [passed], NOW, always).add, []);
});

test('two identical notes on the phone: one is kept, the extra one is cancelled', () => {
  const p = planned('evening', '2026-11-04', 21, 28);
  const r = diffSchedule([onPhone('a', p), onPhone('b', p)], [p], NOW, always);
  assert.deepEqual(r, { cancel: ['b'], add: [] });
});
