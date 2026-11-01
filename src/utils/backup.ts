import type { Ritual } from '../types';
import { DATA_VERSION, sanitizeRituals } from './ritualData';

const BACKUP_APP = 'daybook';

// The text of a backup file: everything needed to bring the rituals back.
export function buildBackup(rituals: Ritual[], now: Date = new Date()): string {
  return JSON.stringify(
    { app: BACKUP_APP, version: DATA_VERSION, exportedAt: now.toISOString(), rituals },
    null,
    2
  );
}

// Local date, so the name matches the day on the user's calendar.
export function backupFileName(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `daybook-backup-${y}-${m}-${d}.json`;
}

export type ParseBackupResult =
  | { ok: true; rituals: Ritual[]; dropped: number; exportedAt: string | null }
  // 'unreadable': not JSON. 'not-backup': JSON, but not a Day Book backup. 'newer': from a later app version.
  | { ok: false; reason: 'unreadable' | 'not-backup' | 'newer' };

export function parseBackup(text: string, now: Date = new Date()): ParseBackupResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'unreadable' };
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, reason: 'not-backup' };
  }
  const file = value as Record<string, unknown>;
  if (file.app !== BACKUP_APP || typeof file.version !== 'number' || !Array.isArray(file.rituals)) {
    return { ok: false, reason: 'not-backup' };
  }
  if (file.version > DATA_VERSION) return { ok: false, reason: 'newer' };

  const { rituals, dropped } = sanitizeRituals(file.rituals, now);
  const exportedAt =
    typeof file.exportedAt === 'string' && !Number.isNaN(Date.parse(file.exportedAt))
      ? file.exportedAt
      : null;
  return { ok: true, rituals, dropped, exportedAt };
}
