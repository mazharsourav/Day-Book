import { addDays } from './dates';

// Counts consecutive days taken, ending today or, when today is not taken yet, yesterday.
// So a 5 day streak still reads 5 in the morning, and only breaks once a whole day is missed.
export function computeStreak(completedDates: string[], today: string): number {
  const taken = new Set(completedDates);
  let cursor = taken.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (taken.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
