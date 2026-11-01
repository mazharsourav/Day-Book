export interface MonthView {
  year: number;
  month: number; // 0 is January
}

// Cells for a Monday-first month grid: leading nulls for the empty cells, then 1..N.
export function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < offset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export function shiftMonth(view: MonthView, delta: number): MonthView {
  const index = view.year * 12 + view.month + delta;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

export function monthIndex(view: MonthView): number {
  return view.year * 12 + view.month;
}

// 'YYYY-MM', the start of every date string in that month.
export function monthPrefix(view: MonthView): string {
  return `${view.year}-${String(view.month + 1).padStart(2, '0')}`;
}

// The earliest month that has any of the given YYYY-MM-DD dates, or `fallback` when there are none.
export function earliestMonth(dates: string[], fallback: MonthView): MonthView {
  let best: MonthView | null = null;
  for (const d of dates) {
    const [y, m] = d.split('-').map(Number);
    if (!y || !m) continue;
    const view = { year: y, month: m - 1 };
    if (best === null || monthIndex(view) < monthIndex(best)) best = view;
  }
  if (best === null || monthIndex(best) > monthIndex(fallback)) return fallback;
  return best;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
