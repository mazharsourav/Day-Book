import { toDateString } from './dates';
import type { PlannedReminder } from './reminderPlan';
import type { ReminderKind } from './reminderSettings';

// What each scheduled note carries, so a later plan can tell its own notes apart, and a tap knows
// where to go.
export interface NoteData {
  kind: ReminderKind;
  day: string;
  at: number;
}

export function noteData(p: PlannedReminder): NoteData {
  return { kind: p.kind, day: p.day, at: p.date.getTime() };
}

function readNoteData(data: unknown): NoteData | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if ((d.kind !== 'evening' && d.kind !== 'morning') || typeof d.day !== 'string' || typeof d.at !== 'number') return null;
  return { kind: d.kind, day: d.day, at: d.at };
}

// A note waiting on the phone, as the phone lists it.
export interface ScheduledNote {
  id: string;
  title: string | null;
  body: string | null;
  data: unknown;
}

// Works out which waiting notes to cancel and which planned ones to add, instead of cancelling
// everything and scheduling it all again. That matters because Android may deliver a note a little
// after its time: a note that is due but not shown yet is kept (if it is for today and still has
// something to say), so planning again at that moment cannot lose it. Notes that are still right
// are left alone, so there is never a gap with nothing scheduled.
export function diffSchedule(
  scheduled: ScheduledNote[],
  plan: PlannedReminder[],
  now: Date,
  stillWanted: (note: NoteData) => boolean
): { cancel: string[]; add: PlannedReminder[] } {
  const today = toDateString(now);
  const future = plan.filter((p) => p.date.getTime() > now.getTime());
  const matched = new Set<PlannedReminder>();
  const cancel: string[] = [];

  for (const note of scheduled) {
    const data = readNoteData(note.data);
    if (data === null) {
      cancel.push(note.id);
      continue;
    }
    if (data.at <= now.getTime()) {
      if (data.day !== today || !stillWanted(data)) cancel.push(note.id);
      continue;
    }
    const same = future.find(
      (p) => !matched.has(p) && p.kind === data.kind && p.date.getTime() === data.at && p.title === note.title && p.body === note.body
    );
    if (same) matched.add(same);
    else cancel.push(note.id);
  }

  return { cancel, add: future.filter((p) => !matched.has(p)) };
}
