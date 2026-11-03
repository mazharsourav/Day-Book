/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Task } from '../types';
import {
  addTask,
  canSaveTaskTitle,
  cleanTaskTitle,
  deleteTask,
  editTask,
  moveTask,
  openCountOn,
  putBack,
  TASK_TITLE_MAX,
  tasksOn,
  toggleTask,
} from './tasks';

// The board's "today" is Wednesday 4 November 2026.
const TODAY = '2026-11-04';
const AT = '2026-11-01T09:00:00.000Z';

const task = (id: string, date: string, done = false, title = `Task ${id}`): Task => ({ id, title, date, done, createdAt: AT });

const list = [task('a', '2026-11-03', true), task('b', TODAY), task('c', TODAY, true), task('d', '2026-11-06')];

function ok<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  assert.equal(r.ok, true, JSON.stringify(r));
  return r as Extract<T, { ok: true }>;
}

test('a title is needed and stops at 60 characters', () => {
  assert.equal(TASK_TITLE_MAX, 60);
  assert.equal(canSaveTaskTitle('  '), false);
  assert.equal(canSaveTaskTitle(' Buy milk '), true);
  assert.equal(cleanTaskTitle('  Buy milk  '), 'Buy milk');
  assert.equal(cleanTaskTitle('x'.repeat(70)).length, 60);
});

test('add puts a task on today or a later day, at the end of that day', () => {
  const r = ok(addTask(list, { id: 'e', title: ' Call the bank ', date: TODAY, createdAt: AT }, TODAY));
  assert.deepEqual(tasksOn(r.tasks, TODAY).map((t) => t.id), ['b', 'c', 'e']);
  assert.equal(r.tasks.at(-1)?.title, 'Call the bank');
  assert.equal(r.tasks.at(-1)?.done, false);
  ok(addTask(list, { id: 'f', title: 'Later', date: '2026-12-25', createdAt: AT }, TODAY));
});

test('add refuses a past day and an empty title', () => {
  assert.deepEqual(addTask(list, { id: 'e', title: 'Late', date: '2026-11-03', createdAt: AT }, TODAY), {
    ok: false,
    reason: 'past-day',
  });
  assert.deepEqual(addTask(list, { id: 'e', title: '  ', date: TODAY, createdAt: AT }, TODAY), {
    ok: false,
    reason: 'empty-title',
  });
});

test('tick and untick on today and later days', () => {
  const r = ok(toggleTask(list, 'b', TODAY));
  assert.equal(r.tasks.find((t) => t.id === 'b')?.done, true);
  const back = ok(toggleTask(r.tasks, 'b', TODAY));
  assert.equal(back.tasks.find((t) => t.id === 'b')?.done, false);
});

test('a task ticked early stays on its planned day', () => {
  const r = ok(toggleTask(list, 'd', TODAY));
  const d = r.tasks.find((t) => t.id === 'd');
  assert.equal(d?.done, true);
  assert.equal(d?.date, '2026-11-06');
});

test('a past day is a record: no tick, no edit, no move, no delete', () => {
  const refused = { ok: false, reason: 'past-day' };
  assert.deepEqual(toggleTask(list, 'a', TODAY), refused);
  assert.deepEqual(editTask(list, 'a', { title: 'New' }, TODAY), refused);
  assert.deepEqual(moveTask(list, 'a', TODAY, TODAY), refused);
  assert.deepEqual(deleteTask(list, 'a', TODAY), refused);
});

test('edit changes the title and the day', () => {
  const r = ok(editTask(list, 'b', { title: ' Renew library books ', date: '2026-11-05' }, TODAY));
  const b = r.tasks.find((t) => t.id === 'b');
  assert.equal(b?.title, 'Renew library books');
  assert.equal(b?.date, '2026-11-05');
});

test('edit refuses an empty title, a past day, and a new day for a done task', () => {
  assert.deepEqual(editTask(list, 'b', { title: ' ' }, TODAY), { ok: false, reason: 'empty-title' });
  assert.deepEqual(editTask(list, 'b', { date: '2026-11-02' }, TODAY), { ok: false, reason: 'past-day' });
  assert.deepEqual(editTask(list, 'c', { date: '2026-11-05' }, TODAY), { ok: false, reason: 'done-cannot-move' });
  // A done task can still be renamed.
  ok(editTask(list, 'c', { title: 'Renamed', date: TODAY }, TODAY));
});

test('move takes a task to the end of another day', () => {
  const r = ok(moveTask(list, 'b', '2026-11-06', TODAY));
  assert.deepEqual(tasksOn(r.tasks, '2026-11-06').map((t) => t.id), ['d', 'b']);
  assert.deepEqual(tasksOn(r.tasks, TODAY).map((t) => t.id), ['c']);
});

test('move refuses a done task and a past day', () => {
  assert.deepEqual(moveTask(list, 'c', '2026-11-06', TODAY), { ok: false, reason: 'done-cannot-move' });
  assert.deepEqual(moveTask(list, 'b', '2026-11-02', TODAY), { ok: false, reason: 'past-day' });
});

test('undo puts a moved task back where it was', () => {
  const r = ok(moveTask(list, 'b', '2026-11-06', TODAY));
  const undone = putBack(r.tasks, r.before.task, r.before.index);
  assert.deepEqual(undone, list);
});

test('undo brings a deleted task back in its place', () => {
  const r = ok(deleteTask(list, 'b', TODAY));
  assert.deepEqual(r.tasks.map((t) => t.id), ['a', 'c', 'd']);
  assert.deepEqual(putBack(r.tasks, r.before.task, r.before.index), list);
});

test('a missing task is reported, not invented', () => {
  const missing = { ok: false, reason: 'not-found' };
  assert.deepEqual(toggleTask(list, 'zz', TODAY), missing);
  assert.deepEqual(editTask(list, 'zz', { title: 'x' }, TODAY), missing);
  assert.deepEqual(moveTask(list, 'zz', TODAY, TODAY), missing);
  assert.deepEqual(deleteTask(list, 'zz', TODAY), missing);
});

test('the Week badge counts tasks still open on a day', () => {
  assert.equal(openCountOn(list, TODAY), 1);
  assert.equal(openCountOn(list, '2026-11-06'), 1);
  assert.equal(openCountOn(list, '2026-11-03'), 0);
  assert.equal(openCountOn([], TODAY), 0);
});
