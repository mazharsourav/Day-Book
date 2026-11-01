import { toDateString } from './dates';
import { computeStreak } from './streak';

// One reminder a day, at a fixed time.
export const REMINDER_HOUR = 20;
export const REMINDER_MINUTE = 0;
export const REMINDER_TIME_LABEL = '8:00 PM';
// How many days ahead are planned. The plan is rebuilt whenever the app opens or something changes.
export const REMINDER_DAYS = 30;

export interface PlannedReminder {
  date: Date;
  title: string;
  body: string;
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

// Builds the reminders to schedule, one per day at 8 PM, starting from `now`.
// A day gets no reminder when every ritual is already taken, or when there are no rituals.
// Future days assume nothing is taken yet. Any change in the app plans again.
export function planReminders(
  rituals: { completedDates: string[] }[],
  now: Date,
  days: number = REMINDER_DAYS
): PlannedReminder[] {
  if (rituals.length === 0) return [];

  const plan: PlannedReminder[] = [];
  for (let offset = 0; offset < days; offset++) {
    const fire = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      REMINDER_HOUR,
      REMINDER_MINUTE,
      0,
      0
    );
    if (fire.getTime() <= now.getTime()) continue;

    const day = toDateString(fire);
    const open = rituals.filter((r) => !r.completedDates.includes(day));
    if (open.length === 0) continue;

    const streak = Math.max(0, ...open.map((r) => computeStreak(r.completedDates, day)));
    plan.push({ date: fire, ...reminderText(open.length, rituals.length, streak) });
  }
  return plan;
}
