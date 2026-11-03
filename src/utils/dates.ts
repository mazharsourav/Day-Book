// Dates are stored as local YYYY-MM-DD strings.

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayString(): string {
  return toDateString(new Date());
}

// Parses YYYY-MM-DD as a local date (new Date('YYYY-MM-DD') would be UTC).
export function fromDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Moves a date string forward or back by whole days.
export function addDays(dateStr: string, days: number): string {
  const d = fromDateString(dateStr);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

// The seven dates of the week that contains `dateStr`. Weeks start on Sunday.
export function weekDatesFor(dateStr: string): string[] {
  const dow = fromDateString(dateStr).getDay(); // 0 is Sunday
  const sunday = addDays(dateStr, -dow);
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}
