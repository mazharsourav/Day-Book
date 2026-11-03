import type { AppData, Ritual, Task } from '../types';
import { parseSaved, parseTaskYear, savedTexts, taskYearText } from './ritualData';

export const DATA_KEY = 'daybook:data';
// The first saves lived here as a bare array. It is read once to move them, and left in place.
export const LEGACY_KEY = 'rituals:v1';
// Where text that could not be read is kept, so starting empty never destroys it.
export const UNREADABLE_KEY = 'daybook:unreadable';

// Each year's tasks are saved under their own key (see savedTexts in ritualData.ts).
export function taskYearKey(year: string): string {
  return `daybook:tasks:${year}`;
}

// The part of AsyncStorage this app uses. multiSet writes several keys in one step.
export interface KeyValueStore {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  multiSet: (pairs: [string, string][]) => Promise<void>;
}

export type LoadStatus =
  | 'ok'
  // The saved text could not be read. A copy was kept and the app starts empty.
  | 'unreadable'
  // Saved by a newer Day Book. Nothing is read or overwritten.
  | 'newer'
  // The phone's storage, or one year of tasks, could not be read. Nothing is overwritten.
  | 'read-failed';

export interface LoadResult {
  status: LoadStatus;
  rituals: Ritual[];
  tasks: Task[];
}

const failed = (status: LoadStatus): LoadResult => ({ status, rituals: [], tasks: [] });

export function createRitualStorage(store: KeyValueStore) {
  // The text last written (or read) under each key, so a save rewrites only what changed.
  let written = new Map<string, string>();
  // The years that had tasks at the last save, so a year that empties is written as empty.
  let years: string[] = [];

  return {
    async load(): Promise<LoadResult> {
      try {
        for (const key of [DATA_KEY, LEGACY_KEY]) {
          const raw = await store.getItem(key);
          if (raw === null) continue;

          const parsed = parseSaved(raw);
          if (!parsed.ok) {
            if (parsed.reason === 'newer') return failed('newer');
            // Keep the unreadable text before anything can replace it. If that fails, stop rather than lose it.
            await store.setItem(UNREADABLE_KEY, raw);
            return failed('unreadable');
          }

          // Every listed year must be read, or nothing is shown or saved, so no tasks can be lost.
          const tasks: Task[] = [];
          const seen = new Map<string, string>();
          for (const year of parsed.taskYears) {
            const yearRaw = await store.getItem(taskYearKey(year));
            if (yearRaw === null) return failed('read-failed');
            const yearParsed = parseTaskYear(yearRaw);
            if (!yearParsed.ok) return failed(yearParsed.reason === 'newer' ? 'newer' : 'read-failed');
            tasks.push(...yearParsed.tasks);
            seen.set(taskYearKey(year), yearRaw);
          }

          if (key === DATA_KEY) {
            written = seen;
            written.set(DATA_KEY, raw);
            years = parsed.taskYears;
          }
          return { status: 'ok', rituals: parsed.rituals, tasks };
        }
        return { status: 'ok', rituals: [], tasks: [] };
      } catch {
        return failed('read-failed');
      }
    },

    // Rituals and every changed year of tasks are written together, in one step, so a save is never half done.
    async save(data: AppData): Promise<void> {
      const { main, years: yearTexts } = savedTexts(data);
      const next = new Map<string, string>([[DATA_KEY, main]]);
      for (const [year, text] of Object.entries(yearTexts)) next.set(taskYearKey(year), text);
      for (const year of years) {
        if (!(year in yearTexts)) next.set(taskYearKey(year), taskYearText(year, []));
      }

      const changed = [...next].filter(([key, text]) => written.get(key) !== text);
      if (changed.length > 0) {
        try {
          await store.multiSet(changed);
        } catch (e) {
          // Not sure what was kept, so the next save writes everything again.
          written = new Map();
          throw e;
        }
      }
      written = next;
      years = Object.keys(yearTexts);
    },
  };
}
