import { morningNote } from '../constants/copy';
import type { Task } from '../types';
import { toDateString } from './dates';
import type { ReminderKind, ReminderSettings, ReminderTime } from './reminderSettings';
import { computeStreak } from './streak';

// The evening reminder's time in 1.0.0, and the default now.
export const REMINDER_HOUR = 20;
export const REMINDER_MINUTE = 0;
// How many days ahead are planned. The plan is rebuilt whenever the app opens or something changes.
export const REMINDER_DAYS = 30;
export const MORNING_DAYS = 14;

export interface PlannedReminder {
  kind: ReminderKind;
  // The day the note is about (YYYY-MM-DD).
  day: string;
  date: Date;
  title: string;
  body: string;
}

interface PlanOptions {
  time?: ReminderTime;
  // Today's note already went out (see alreadySentToday), so today gets none.
  skipToday?: boolean;
}

// The words of one reminder. `left` of `total` rituals are open, and `streak` is the longest
// streak among the open ones.
export function reminderText(
  left: number,
  total: number,
  streak: number
): { title: string; body: string } {
  let title: string;
  if (total === 1) title = 'Your ritual is still open today';
  else if (left === total) title = `All ${total} rituals are still open today`;
  else title = `${left} of your ${total} rituals ${left === 1 ? 'is' : 'are'} still open today`;

  const body = streak >= 2 ? `Keep your ${streak}-day streak going.` : "There's still time today.";
  return { title, body };
}

// Each day's time from `now` on, in local time (so it stays put across daylight saving changes).
// Times already past today are left out, and so is today when `skipToday` is set.
function fireTimes(now: Date, days: number, { time, skipToday }: PlanOptions, fallback: ReminderTime): Date[] {
  const { hour, minute } = time ?? fallback;
  const times: Date[] = [];
  for (let offset = skipToday ? 1 : 0; offset < days; offset++) {
    const fire = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute, 0, 0);
    if (fire.getTime() > now.getTime()) times.push(fire);
  }
  return times;
}

// The evening reminder, one a day at its time, starting from `now`.
// A day gets no reminder when every ritual is already taken, or when there are no rituals.
// Future days assume nothing is taken yet. Any change in the app plans again.
export function planReminders(
  rituals: { completedDates: string[] }[],
  now: Date,
  days: number = REMINDER_DAYS,
  options: PlanOptions = {}
): PlannedReminder[] {
  if (rituals.length === 0) return [];

  const plan: PlannedReminder[] = [];
  for (const fire of fireTimes(now, days, options, { hour: REMINDER_HOUR, minute: REMINDER_MINUTE })) {
    const day = toDateString(fire);
    const open = rituals.filter((r) => !r.completedDates.includes(day));
    if (open.length === 0) continue;

    const streak = Math.max(0, ...open.map((r) => computeStreak(r.completedDates, day)));
    plan.push({ kind: 'evening', day, date: fire, ...reminderText(open.length, rituals.length, streak) });
  }
  return plan;
}

// The morning note: how many tasks are still open that day, for the next 14 days.
// No note on a day with nothing open. Never a task title.
export function planMorning(tasks: Task[], now: Date, options: PlanOptions, days: number = MORNING_DAYS): PlannedReminder[] {
  const open = new Map<string, number>();
  for (const t of tasks) if (!t.done) open.set(t.date, (open.get(t.date) ?? 0) + 1);

  const plan: PlannedReminder[] = [];
  for (const fire of fireTimes(now, days, options, { hour: 8, minute: 0 })) {
    const day = toDateString(fire);
    const count = open.get(day) ?? 0;
    if (count > 0) plan.push({ kind: 'morning', day, date: fire, ...morningNote(count) });
  }
  return plan;
}

// Whether a note that is due but not shown yet still has something to say: its reminder is still on,
// and a ritual (evening) or a task (morning) is still open on its day.
export function stillWorthSending(
  note: { kind: ReminderKind; day: string },
  settings: ReminderSettings,
  rituals: { completedDates: string[] }[],
  tasks: Task[]
): boolean {
  if (!settings[note.kind].on) return false;
  if (note.kind === 'evening') return rituals.some((r) => !r.completedDates.includes(note.day));
  return tasks.some((t) => t.date === note.day && !t.done);
}

// "Day Book never sends a note twice." For each kind the app remembers the time it planned for today.
// Once that time has passed the note is taken as sent, and a re-plan (say, a new time) skips today.
export interface SentRecord {
  day: string;
  at: number;
}
export type SentRecords = Partial<Record<ReminderKind, SentRecord>>;

export function alreadySentToday(record: SentRecord | undefined, now: Date): boolean {
  return record !== undefined && record.day === toDateString(now) && record.at <= now.getTime();
}

export function nextSentRecord(previous: SentRecord | undefined, plan: PlannedReminder[], now: Date): SentRecord | undefined {
  if (alreadySentToday(previous, now)) return previous;
  const today = toDateString(now);
  const planned = plan.find((p) => p.day === today);
  return planned ? { day: today, at: planned.date.getTime() } : undefined;
}

// Everything to schedule: the reminders that are on, and the records to keep for next time.
export function planAll(
  settings: ReminderSettings,
  rituals: { completedDates: string[] }[],
  tasks: Task[],
  now: Date,
  sent: SentRecords
): { plan: PlannedReminder[]; sent: SentRecords } {
  const evening = settings.evening.on
    ? planReminders(rituals, now, REMINDER_DAYS, { time: settings.evening, skipToday: alreadySentToday(sent.evening, now) })
    : [];
  const morning = settings.morning.on
    ? planMorning(tasks, now, { time: settings.morning, skipToday: alreadySentToday(sent.morning, now) })
    : [];
  return {
    plan: [...evening, ...morning],
    sent: { evening: nextSentRecord(sent.evening, evening, now), morning: nextSentRecord(sent.morning, morning, now) },
  };
}
