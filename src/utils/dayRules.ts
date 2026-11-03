import { MONTH_NAMES } from './calendar';
import { addDays, fromDateString } from './dates';

// The day rules of 2.0.0, from the design board. Dates are local YYYY-MM-DD strings.

export type DayKind = 'past' | 'today' | 'future';

export function dayKind(date: string, today: string): DayKind {
  if (date < today) return 'past';
  return date === today ? 'today' : 'future';
}

// A ritual can be ticked or unticked only for today and yesterday. Older days are a record.
export function isEditableRitualDay(date: string, today: string): boolean {
  return date === today || date === addDays(today, -1);
}

// "1 – 7 November", or "29 November – 5 December" when the week crosses a month.
export function weekRangeLabel(sunday: string): string {
  const start = fromDateString(sunday);
  const end = fromDateString(addDays(sunday, 6));
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  return startMonth === endMonth
    ? `${start.getDate()} – ${end.getDate()} ${endMonth}`
    : `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`;
}

// At midnight the screen moves to the new today only if it was showing today.
export function selectedDayAfterRollover(selected: string, previousToday: string, newToday: string): string {
  return selected === previousToday ? newToday : selected;
}
