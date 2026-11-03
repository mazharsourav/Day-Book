import { getCalendarDays, MonthView, monthPrefix } from './calendar';
import { toDateString } from './dates';

// The card's sizes from the design board, in hundredths of the card's width. The card is always 9:16.
// The top and bottom margins keep the title and logo clear of the bars Instagram lays over a Story.
export const SHARE_CARD = {
  padY: 22,
  padX: 7,
  title: 9,
  summary: 4.2,
  summaryGap: 1.5,
  dotsWidth: 86,
  gap: 1.6,
  number: 3.7,
  logo: 10,
  mark: 4.4,
  markGap: 2.4,
} as const;

// How a day looks on the card. The rules are the same as the History calendar.
export type DayState = 'all' | 'some' | 'none' | 'future';

export interface MonthCardModel {
  // Empty cells before day 1, in a Sunday-first week.
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
