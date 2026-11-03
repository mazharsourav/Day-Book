import type { Task } from '../types';
import { TASK_TITLE_MAX } from './ritualData';

// The Week list's rules, kept away from the screens so each one can be tested.
// Every change returns a new list, or says why it was refused. Dates are local YYYY-MM-DD strings.

export { TASK_TITLE_MAX };

export type TaskRefusal =
  // A past day is a record: its tasks cannot be ticked, edited, moved or deleted, and nothing goes onto it.
  | 'past-day'
  // A ticked task stays on the day it was planned for.
  | 'done-cannot-move'
  | 'empty-title'
  | 'not-found';

// Where a task sat before a change, so Undo can put it back exactly.
export interface Placed {
  task: Task;
  index: number;
}

export type TaskResult = { ok: true; tasks: Task[]; before: Placed } | { ok: false; reason: TaskRefusal };
export type AddResult = { ok: true; tasks: Task[] } | { ok: false; reason: TaskRefusal };

export function canSaveTaskTitle(title: string): boolean {
  return title.trim().length > 0;
}

export function cleanTaskTitle(title: string): string {
  return title.trim().slice(0, TASK_TITLE_MAX);
}

const isPast = (date: string, today: string) => date < today;

function find(tasks: Task[], id: string, today: string): Placed | TaskRefusal {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return 'not-found';
  if (isPast(tasks[index].date, today)) return 'past-day';
  return { task: tasks[index], index };
}

function replaceAt(tasks: Task[], index: number, task: Task): Task[] {
  return tasks.map((t, i) => (i === index ? task : t));
}

// A new task goes at the end of its day.
export function addTask(
  tasks: Task[],
  input: { id: string; title: string; date: string; createdAt: string },
  today: string
): AddResult {
  if (isPast(input.date, today)) return { ok: false, reason: 'past-day' };
  const title = cleanTaskTitle(input.title);
  if (title === '') return { ok: false, reason: 'empty-title' };
  return { ok: true, tasks: [...tasks, { id: input.id, title, date: input.date, done: false, createdAt: input.createdAt }] };
}

// Edit task: a new title, a new day, or both. A done task keeps its day.
export function editTask(tasks: Task[], id: string, changes: { title?: string; date?: string }, today: string): TaskResult {
  const found = find(tasks, id, today);
  if (typeof found === 'string') return { ok: false, reason: found };
  const { task, index } = found;

  const title = changes.title === undefined ? task.title : cleanTaskTitle(changes.title);
  if (title === '') return { ok: false, reason: 'empty-title' };

  const date = changes.date ?? task.date;
  if (date !== task.date) {
    if (task.done) return { ok: false, reason: 'done-cannot-move' };
    if (isPast(date, today)) return { ok: false, reason: 'past-day' };
    // A task given a new day goes to the end of that day, as a move does.
    const rest = tasks.filter((_, i) => i !== index);
    return { ok: true, tasks: [...rest, { ...task, title, date }], before: found };
  }
  return { ok: true, tasks: replaceAt(tasks, index, { ...task, title }), before: found };
}

// Tick or untick. Any day that is not past can be ticked; the task stays on its planned day.
export function toggleTask(tasks: Task[], id: string, today: string): TaskResult {
  const found = find(tasks, id, today);
  if (typeof found === 'string') return { ok: false, reason: found };
  return { ok: true, tasks: replaceAt(tasks, found.index, { ...found.task, done: !found.task.done }), before: found };
}

// Move to another day, where the task goes last.
export function moveTask(tasks: Task[], id: string, toDate: string, today: string): TaskResult {
  const found = find(tasks, id, today);
  if (typeof found === 'string') return { ok: false, reason: found };
  if (found.task.done) return { ok: false, reason: 'done-cannot-move' };
  if (isPast(toDate, today)) return { ok: false, reason: 'past-day' };
  const rest = tasks.filter((_, i) => i !== found.index);
  return { ok: true, tasks: [...rest, { ...found.task, date: toDate }], before: found };
}

// No confirmation: "Task deleted. Undo" follows, and Undo uses `before`.
export function deleteTask(tasks: Task[], id: string, today: string): TaskResult {
  const found = find(tasks, id, today);
  if (typeof found === 'string') return { ok: false, reason: found };
  return { ok: true, tasks: tasks.filter((_, i) => i !== found.index), before: found };
}

// Undo for a move or a delete: the task as it was, back in its old place.
export function putBack(tasks: Task[], task: Task, index: number): Task[] {
  const rest = tasks.filter((t) => t.id !== task.id);
  const at = Math.min(Math.max(index, 0), rest.length);
  return [...rest.slice(0, at), task, ...rest.slice(at)];
}

// A day's tasks, in the order they were added. There is no reordering inside a day.
export function tasksOn(tasks: Task[], date: string): Task[] {
  return tasks.filter((t) => t.date === date);
}

// Tasks still open on a day. The Week tab shows this for today.
export function openCountOn(tasks: Task[], date: string): number {
  return tasks.filter((t) => t.date === date && !t.done).length;
}
