import { getCalendarDays, MonthView, monthPrefix } from './calendar';
import { toDateString } from './dates';

// How a day looks on the card. The rules are the same as the History calendar.
export type DayState = 'all' | 'some' | 'none' | 'future';

export interface MonthCardModel {
  // Empty cells before day 1, in a Monday-first week.
  leading: number;
  days: { day: number; state: DayState }[];
  doses: number;
  ritualCount: number;
}

export function buildMonthCard(
  rituals: { completedDates: string[] }[],
  view: MonthView,
  today: string
): MonthCardModel {
  const cells = getCalendarDays(view.year, view.month);
  const leading = cells.filter((c) => c === null).length;
  const prefix = monthPrefix(view);

  const days = cells
    .filter((c): c is number => c !== null)
    .map((day) => {
      const date = toDateString(new Date(view.year, view.month, day));
      if (date > today) return { day, state: 'future' as const };
      const count = rituals.filter((r) => r.completedDates.includes(date)).length;
      if (rituals.length > 0 && count === rituals.length) return { day, state: 'all' as const };
      return { day, state: count > 0 ? ('some' as const) : ('none' as const) };
    });

  const doses = rituals.reduce(
    (sum, r) => sum + r.completedDates.filter((d) => d.startsWith(prefix)).length,
    0
  );

  return { leading, days, doses, ritualCount: rituals.length };
}

// The line under the month name, for example "4 rituals, 106 doses taken".
export function monthCardSummary(model: Pick<MonthCardModel, 'ritualCount' | 'doses'>): string {
  const rituals = `${model.ritualCount} ${model.ritualCount === 1 ? 'ritual' : 'rituals'}`;
  const doses = `${model.doses} ${model.doses === 1 ? 'dose' : 'doses'} taken`;
  return `${rituals}, ${doses}`;
}
