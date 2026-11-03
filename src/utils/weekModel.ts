import { taskCountLine } from '../constants/copy';
import type { Task } from '../types';
import { MONTH_NAMES } from './calendar';
import { addDays, fromDateString, weekDatesFor } from './dates';
import { weekRangeLabel } from './dayRules';
import type { DotState, StripDay } from './todayModel';

// What the Week tab and the task form show, worked out away from the screens so it can be tested.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LETTERS = 'SMTWTFS';

// Past days and earlier weeks are a record: nothing on them can be changed.
export function isReadOnlyDay(date: string, today: string): boolean {
  return date < today;
}

function dotFor(tasks: Task[], date: string): DotState {
  const day = tasks.filter((t) => t.date === date);
  if (day.length === 0) return 'none';
  return day.every((t) => t.done) ? 'all' : 'some';
}

function stripDays(selected: string, today: string, day: (date: string) => Pick<StripDay, 'dot' | 'disabled'>): StripDay[] {
  return weekDatesFor(selected).map((date, i) => ({
    date,
    letter: LETTERS[i],
    number: fromDateString(date).getDate(),
    isToday: date === today,
    isFuture: date > today,
    selected: date === selected,
    ...day(date),
  }));
}

// The Week tab's strip: any day can be chosen, past ones to read.
export function weekStrip(selected: string, today: string, tasks: Task[]): StripDay[] {
  return stripDays(selected, today, (date) => ({ dot: dotFor(tasks, date), disabled: false }));
}

// The Day picker in Add task and Edit task: past days cannot be chosen, and there are no dots.
export function formStrip(selected: string, today: string): StripDay[] {
  return stripDays(selected, today, (date) => ({ dot: 'none', disabled: date < today }));
}

// "1 – 7 November" for the week holding `date`.
export function weekRangeFor(date: string): string {
  return weekRangeLabel(weekDatesFor(date)[0]);
}

// The arrows move a whole week and keep the weekday.
export function shiftWeek(date: string, weeks: number): string {
  return addDays(date, weeks * 7);
}

// The form's back arrow stops at the last week that still has a day to come.
export function canGoToEarlierFormWeek(selected: string, today: string): boolean {
  return weekDatesFor(shiftWeek(selected, -1))[6] >= today;
}

export function weekDayHeading(date: string, today: string): string {
  return date === today ? 'Today' : WEEKDAYS[fromDateString(date).getDay()];
}

// "3 November · 2 tasks, 1 done"
export function weekDaySubtitle(date: string, tasks: Task[]): string {
  const d = fromDateString(date);
  const day = tasks.filter((t) => t.date === date);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} · ${taskCountLine(day.length, day.filter((t) => t.done).length)}`;
}

export function weekdayName(date: string): string {
  return WEEKDAYS[fromDateString(date).getDay()];
}
