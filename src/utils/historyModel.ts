import { COPY, dayCountLine } from '../constants/copy';
import { MONTH_NAMES, MonthView, monthPrefix } from './calendar';
import { fromDateString, toDateString } from './dates';
import { buildMonthCard, DayState } from './monthCard';

// What History and its day sheet show, worked out away from the screens so it can be tested.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface HistoryCell {
  day: number;
  date: string;
  state: DayState;
  isToday: boolean;
}

// The month in rows of seven, Sunday first, with empty cells at both ends.
export function historyWeeks(
  rituals: { completedDates: string[] }[],
  view: MonthView,
  today: string
): (HistoryCell | null)[][] {
  const model = buildMonthCard(rituals, view, today);
  const cells: (HistoryCell | null)[] = Array.from({ length: model.leading }, () => null);
  for (const { day, state } of model.days) {
    const date = toDateString(new Date(view.year, view.month, day));
    cells.push({ day, date, state, isToday: date === today });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (HistoryCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function ritualDaysInMonth(completedDates: string[], view: MonthView): number {
  const prefix = monthPrefix(view);
  return completedDates.filter((d) => d.startsWith(prefix)).length;
}

// "Tuesday 3 November"
export function daySheetTitle(date: string): string {
  const d = fromDateString(date);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

// History is only for reading, so every day says so. Today and yesterday are changed on Today.
export function daySheetSubtitle(done: number, total: number): string {
  return dayCountLine(done, total) + COPY.today.readOnlySuffix;
}
