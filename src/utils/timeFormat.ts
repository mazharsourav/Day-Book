import type { ReminderTime } from './reminderSettings';

// Times follow the phone: 12 hour ("8:00 PM") or 24 hour ("20:00"). There is no setting for it.

const two = (n: number) => String(n).padStart(2, '0');

export function timeLabel(t: ReminderTime, uses24: boolean): string {
  if (uses24) return `${two(t.hour)}:${two(t.minute)}`;
  const hour = t.hour % 12 === 0 ? 12 : t.hour % 12;
  return `${hour}:${two(t.minute)} ${t.hour < 12 ? 'AM' : 'PM'}`;
}

// The scrolling wheel (board frame 36): hours, every minute (the board drew fives; Mazhar chose
// every minute, 3 November 2026), and AM/PM on a 12 hour phone.
export function wheelColumns(uses24: boolean): { hours: number[]; minutes: number[]; periods: boolean } {
  const hours = uses24 ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  return { hours, minutes, periods: !uses24 };
}

// Where a time sits on the wheel. `hour` is 1 to 12 with `pm` on a 12 hour phone, 0 to 23 otherwise.
export interface WheelValue {
  hour: number;
  minute: number;
  pm: boolean;
}

export function toWheel(t: ReminderTime, uses24: boolean): WheelValue {
  if (uses24) return { hour: t.hour, minute: t.minute, pm: t.hour >= 12 };
  return { hour: t.hour % 12 === 0 ? 12 : t.hour % 12, minute: t.minute, pm: t.hour >= 12 };
}

export function fromWheel(w: WheelValue, uses24: boolean): ReminderTime {
  if (uses24) return { hour: w.hour, minute: w.minute };
  return { hour: (w.hour % 12) + (w.pm ? 12 : 0), minute: w.minute };
}
