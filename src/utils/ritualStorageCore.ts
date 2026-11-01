import type { Ritual } from '../types';
import { parseSaved, serializeSaved } from './ritualData';

export const DATA_KEY = 'daybook:data';
// The first saves lived here as a bare array. It is read once to move them, and left in place.
export const LEGACY_KEY = 'rituals:v1';
// Where text that could not be read is kept, so starting empty never destroys it.
export const UNREADABLE_KEY = 'daybook:unreadable';

// The part of AsyncStorage this app uses.
export interface KeyValueStore {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

export type LoadStatus =
  | 'ok'
  // The saved text could not be read. A copy was kept and the app starts empty.
  | 'unreadable'
  // Saved by a newer Day Book. Nothing is read or overwritten.
  | 'newer'
  // The phone's storage could not be opened at all. Nothing is overwritten.
  | 'read-failed';

export interface LoadResult {
  status: LoadStatus;
  rituals: Ritual[];
}

export function createRitualStorage(store: KeyValueStore) {
  return {
    async load(): Promise<LoadResult> {
      try {
        for (const key of [DATA_KEY, LEGACY_KEY]) {
          const raw = await store.getItem(key);
          if (raw === null) continue;

          const parsed = parseSaved(raw);
          if (parsed.ok) return { status: 'ok', rituals: parsed.rituals };
          if (parsed.reason === 'newer') return { status: 'newer', rituals: [] };

          // Keep the unreadable text before anything can replace it. If that fails, stop rather than lose it.
          await store.setItem(UNREADABLE_KEY, raw);
          return { status: 'unreadable', rituals: [] };
        }
        return { status: 'ok', rituals: [] };
      } catch {
        return { status: 'read-failed', rituals: [] };
      }
    },

    save(rituals: Ritual[]): Promise<void> {
      return store.setItem(DATA_KEY, serializeSaved(rituals));
    },
  };
}
