import { normalizeIcon } from '../constants/iconKeys';
import type { AppData, Ritual, Task } from '../types';

// Bump this when the saved shape changes, and add a step to `parseSaved` for the old one.
//   0: a bare array of rituals (the first saves, before there was a version)
//   1: { version, rituals } (Day Book 1.0.0)
//   2: { version, rituals, tasks } (Day Book 2.0.0)
export const DATA_VERSION = 2;

// The longest task title. Longer saved titles are cut, not dropped.
export const TASK_TITLE_MAX = 60;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Turns whatever was saved or imported into rituals the app can safely show.
// Anything that is not a ritual is dropped, and the number dropped is reported.
export function sanitizeRituals(
  input: unknown,
  now: Date = new Date()
): { rituals: Ritual[]; dropped: number } {
  if (!Array.isArray(input)) return { rituals: [], dropped: 0 };

  const rituals: Ritual[] = [];
  const seen = new Set<string>();
  let dropped = 0;

  for (const item of input) {
    if (!isObject(item) || typeof item.id !== 'string' || item.id === '' || seen.has(item.id)) {
      dropped++;
      continue;
    }
    seen.add(item.id);

    const dates = Array.isArray(item.completedDates)
      ? item.completedDates.filter((d): d is string => typeof d === 'string' && DATE_PATTERN.test(d))
      : [];
    const completedDates = [...new Set(dates)];

    const createdAt =
      typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt))
        ? item.createdAt
        : now.toISOString();

    rituals.push({
      id: item.id,
      name: typeof item.name === 'string' ? item.name : '',
      icon: normalizeIcon(item.icon),
      note: typeof item.note === 'string' ? item.note : '',
      completedDates,
      createdAt,
    });
  }

  return { rituals, dropped };
}

// Turns whatever was saved or imported into tasks the app can safely show.
// A task needs an id, a title and a real day; anything else is dropped and counted.
export function sanitizeTasks(input: unknown, now: Date = new Date()): { tasks: Task[]; dropped: number } {
  if (!Array.isArray(input)) return { tasks: [], dropped: 0 };

  const tasks: Task[] = [];
  const seen = new Set<string>();
  let dropped = 0;

  for (const item of input) {
    const title = isObject(item) && typeof item.title === 'string' ? item.title.trim().slice(0, TASK_TITLE_MAX) : '';
    if (
      !isObject(item) ||
      typeof item.id !== 'string' ||
      item.id === '' ||
      seen.has(item.id) ||
      title === '' ||
      typeof item.date !== 'string' ||
      !DATE_PATTERN.test(item.date)
    ) {
      dropped++;
      continue;
    }
    seen.add(item.id);

    const createdAt =
      typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt))
        ? item.createdAt
        : now.toISOString();

    tasks.push({ id: item.id, title, date: item.date, done: item.done === true, createdAt });
  }

  return { tasks, dropped };
}

export type ParseSavedResult =
  | { ok: true; rituals: Ritual[]; taskYears: string[]; dropped: number; fromVersion: number }
  // 'corrupt': not readable as Day Book data. 'newer': saved by a later version of the app.
  | { ok: false; reason: 'corrupt' | 'newer' };

const YEAR_PATTERN = /^\d{4}$/;

// Reads the main saved text, whatever version wrote it. From version 2 the tasks are kept apart,
// one text per year, and this text lists the years that have one.
export function parseSaved(raw: string, now: Date = new Date()): ParseSavedResult {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'corrupt' };
  }

  let list: unknown;
  let years: unknown = [];
  let fromVersion: number;
  if (Array.isArray(value)) {
    list = value;
    fromVersion = 0;
  } else if (isObject(value) && typeof value.version === 'number') {
    if (value.version > DATA_VERSION) return { ok: false, reason: 'newer' };
    list = value.rituals;
    // Versions 0 and 1 had no tasks. A missing list in version 2 is read as none.
    if (value.version >= 2 && value.taskYears !== undefined) years = value.taskYears;
    fromVersion = value.version;
  } else {
    return { ok: false, reason: 'corrupt' };
  }

  if (!Array.isArray(list) || !Array.isArray(years)) return { ok: false, reason: 'corrupt' };
  const r = sanitizeRituals(list, now);
  const taskYears = years.filter((y): y is string => typeof y === 'string' && YEAR_PATTERN.test(y));
  return { ok: true, rituals: r.rituals, taskYears, dropped: r.dropped, fromVersion };
}

export type ParseTaskYearResult =
  | { ok: true; tasks: Task[]; dropped: number }
  | { ok: false; reason: 'corrupt' | 'newer' };

// Reads one year's saved tasks.
export function parseTaskYear(raw: string, now: Date = new Date()): ParseTaskYearResult {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
  if (!isObject(value) || typeof value.version !== 'number' || !Array.isArray(value.tasks)) {
    return { ok: false, reason: 'corrupt' };
  }
  if (value.version > DATA_VERSION) return { ok: false, reason: 'newer' };
  const { tasks, dropped } = sanitizeTasks(value.tasks, now);
  return { ok: true, tasks, dropped };
}

// The texts to save. Android cannot read back one saved value over 2 MB, so the tasks are split by
// year (a heavy year is about 0.3 MB) and the main text holds the rituals and the list of years.
// A day's tasks keep their order, since a day belongs to one year.
export function savedTexts(data: AppData): { main: string; years: Record<string, string> } {
  const byYear = new Map<string, Task[]>();
  for (const task of data.tasks) {
    const year = task.date.slice(0, 4);
    const list = byYear.get(year);
    if (list) list.push(task);
    else byYear.set(year, [task]);
  }
  const taskYears = [...byYear.keys()].sort();
  const years: Record<string, string> = {};
  for (const year of taskYears) years[year] = taskYearText(year, byYear.get(year) ?? []);
  return { main: JSON.stringify({ version: DATA_VERSION, rituals: data.rituals, taskYears }), years };
}

export function taskYearText(year: string, tasks: Task[]): string {
  return JSON.stringify({ version: DATA_VERSION, year, tasks });
}
