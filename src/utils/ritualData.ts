import { normalizeIcon } from '../constants/iconKeys';
import type { Ritual } from '../types';

// Bump this when the saved shape changes, and add a step to `parseSaved` for the old one.
//   0: a bare array of rituals (the first saves, before there was a version)
//   1: { version, rituals }
export const DATA_VERSION = 1;

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

export type ParseSavedResult =
  | { ok: true; rituals: Ritual[]; dropped: number; fromVersion: number }
  // 'corrupt': not readable as Day Book data. 'newer': saved by a later version of the app.
  | { ok: false; reason: 'corrupt' | 'newer' };

// Reads the text saved on the phone, whatever version wrote it.
export function parseSaved(raw: string, now: Date = new Date()): ParseSavedResult {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'corrupt' };
  }

  let list: unknown;
  let fromVersion: number;
  if (Array.isArray(value)) {
    list = value;
    fromVersion = 0;
  } else if (isObject(value) && typeof value.version === 'number') {
    if (value.version > DATA_VERSION) return { ok: false, reason: 'newer' };
    list = value.rituals;
    fromVersion = value.version;
  } else {
    return { ok: false, reason: 'corrupt' };
  }

  if (!Array.isArray(list)) return { ok: false, reason: 'corrupt' };
  const { rituals, dropped } = sanitizeRituals(list, now);
  return { ok: true, rituals, dropped, fromVersion };
}

export function serializeSaved(rituals: Ritual[]): string {
  return JSON.stringify({ version: DATA_VERSION, rituals });
}
