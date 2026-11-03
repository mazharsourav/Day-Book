// Where a tapped reminder leads (board card "Where a reminder leads").

export type NoteRoute = { tab: 'today' | 'week'; day: string };

// The evening note opens Today and the morning note opens Week, both on today, even when the note
// was left in the shade from an earlier day. A 1.0.0 note has no data and opens Today.
export function routeForNotification(data: unknown, today: string): NoteRoute {
  const kind = typeof data === 'object' && data !== null ? (data as { kind?: unknown }).kind : undefined;
  return { tab: kind === 'morning' ? 'week' : 'today', day: today };
}

// Forms keep what was typed: while one is open the tab changes only after it is saved or cancelled.
const FORM_PATHS = ['/create', '/task', '/share-month'];

export function isFormPath(pathname: string): boolean {
  return FORM_PATHS.includes(pathname);
}
