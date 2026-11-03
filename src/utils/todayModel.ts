import { COPY } from '../constants/copy';
import { MONTH_NAMES } from './calendar';
import { addDays, fromDateString, weekDatesFor } from './dates';
import { dayKind, isEditableRitualDay } from './dayRules';

// What Today, the ritual screen and the ritual form show, worked out away from the screens so it can be tested.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LETTERS = 'SMTWTFS';

// Only what these rules need from a ritual.
type Ticks = { completedDates: string[] };

export const RITUAL_NAME_MAX = 40;

export function canSaveRitualName(name: string): boolean {
  return name.trim().length > 0;
}

export function cleanRitualName(name: string): string {
  return name.trim().slice(0, RITUAL_NAME_MAX);
}

// "Today", "Yesterday", or the weekday for an older day.
export function dayHeading(date: string, today: string): string {
  if (date === today) return COPY.common.today;
  if (date === addDays(today, -1)) return COPY.common.yesterday;
  return WEEKDAYS[fromDateString(date).getDay()];
}

// "Wednesday, 4 November"
export function dayDateLine(date: string): string {
  const d = fromDateString(date);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function todaySubtitle(date: string, today: string): string {
  const readOnly = dayKind(date, today) === 'past' && !isEditableRitualDay(date, today);
  return dayDateLine(date) + (readOnly ? COPY.today.readOnlySuffix : '');
}

export type DotState = 'all' | 'some' | 'none';

export function doneOn(rituals: Ticks[], date: string): number {
  return rituals.filter((r) => r.completedDates.includes(date)).length;
}

export function dayDotState(rituals: Ticks[], date: string): DotState {
  const done = doneOn(rituals, date);
  if (rituals.length === 0 || done === 0) return 'none';
  return done === rituals.length ? 'all' : 'some';
}

export interface StripDay {
  date: string;
  letter: string;
  number: number;
  isToday: boolean;
  isFuture: boolean;
  selected: boolean;
  dot: DotState;
  // Cannot be chosen, and drawn faded: days to come on Today, past days in the task form.
  disabled: boolean;
}

// The seven days of this week on Today, Sunday first.
export function todayStrip(today: string, selected: string, rituals: Ticks[]): StripDay[] {
  return weekDatesFor(today).map((date, i) => {
    const isFuture = date > today;
    return {
      date,
      letter: LETTERS[i],
      number: fromDateString(date).getDate(),
      isToday: date === today,
      isFuture,
      selected: date === selected,
      dot: isFuture ? 'none' : dayDotState(rituals, date),
      disabled: isFuture,
    };
  });
}

export function showAllDoneNote(done: number, total: number, isToday: boolean): boolean {
  return isToday && total > 0 && done === total;
}

export interface RitualWeekDay {
  date: string;
  letter: string;
  done: boolean;
  isToday: boolean;
  kind: 'locked' | 'editable' | 'future';
}

// "This week" on the ritual screen.
export function ritualWeek(completedDates: string[], today: string): RitualWeekDay[] {
  const done = new Set(completedDates);
  return weekDatesFor(today).map((date, i) => ({
    date,
    letter: LETTERS[i],
    done: done.has(date),
    isToday: date === today,
    kind: date > today ? 'future' : isEditableRitualDay(date, today) ? 'editable' : 'locked',
  }));
}
