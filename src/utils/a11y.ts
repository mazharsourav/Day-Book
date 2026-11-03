import { MONTH_NAMES } from './calendar';
import { addDays, fromDateString } from './dates';

// What a screen reader says, from the design board ("Reading aloud and reaching").
// TalkBack adds the role ("checkbox, checked") by itself, so the labels leave it out.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface SpokenLabel {
  label: string;
  hint: string | undefined;
}

export function tickLabel(name: string, done: boolean): SpokenLabel {
  return done
    ? { label: `${name}, done today`, hint: 'Double tap to undo' }
    : { label: `Mark ${name} as done`, hint: undefined };
}

// A circle on a day that can no longer be changed.
export function lockedTickLabel(name: string, done: boolean): string {
  return `${name}, ${done ? 'done' : 'not done'}. Read only.`;
}

export function ritualNameLabel(name: string, streak: number): string {
  const s = streak > 0 ? `${streak} day streak` : 'no streak yet';
  return `${name}, ${s}. Opens the ritual.`;
}

export function progressLabel(done: number, total: number, isToday: boolean): string {
  if (total > 0 && done === total) return `All ${total} done.`;
  const left = total - done;
  return isToday && left > 0 ? `${done} of ${total} done, ${left} left.` : `${done} of ${total} done.`;
}

// A day in a week strip. Future days have nothing to count yet.
export function dayLabel(date: string, today: string, done: number, total: number): string {
  const d = fromDateString(date);
  const name = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  if (date > today) return `${name}.`;
  const when = date === today ? ', today' : date === addDays(today, -1) ? ', yesterday' : '';
  const readOnly = date < addDays(today, -1) ? ' Read only.' : '';
  return `${name}${when}, ${done} of ${total} done.${readOnly}`;
}

// A day on the ritual screen's week. TalkBack adds "checked" or "not checked" by itself.
export function ritualDayLabel(date: string, today: string, done: boolean): SpokenLabel {
  const d = fromDateString(date);
  const name = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  if (date > today) return { label: `${name}, upcoming`, hint: undefined };
  if (date < addDays(today, -1)) return { label: `${name}. Read only.`, hint: undefined };
  const when = date === today ? 'today' : 'yesterday';
  return { label: `${name}, ${when}`, hint: done ? 'Double tap to undo' : 'Double tap to mark done' };
}

export function taskLabel(title: string, date: string, done: boolean, readOnly: boolean): SpokenLabel {
  const weekday = WEEKDAYS[fromDateString(date).getDay()];
  const label = `${title}, ${weekday}, ${done ? 'done' : 'not done'}`;
  if (readOnly) return { label: `${label}. Read only.`, hint: undefined };
  return { label, hint: done ? 'Double tap to undo' : 'Double tap to mark done' };
}

export function weekTabLabel(openToday: number): string {
  if (openToday === 0) return 'Week';
  return `Week, ${openToday} ${openToday === 1 ? 'task' : 'tasks'} open today`;
}

// The small number on the Week tab.
export function badgeText(count: number): string {
  if (count <= 0) return '';
  return count > 99 ? '99+' : String(count);
}
