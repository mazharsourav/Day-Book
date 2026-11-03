// How long things move, from the design board ("Motion and type").
// Three speeds only, nothing over 300 ms. Things coming in start fast and settle softly; things leaving are quicker.
// Mazhar, 4 November 2026: shorter and smoother, like Apple's own apps (was 150, 220 and 320 ms).
// The curves are in easing.ts.

export const SPEED = { fast: 100, medium: 160, slow: 240 } as const;

// One entry per row of the board's motion table.
export const MOTION = {
  tickFill: SPEED.fast,
  tickCheck: SPEED.medium,
  tickBar: SPEED.slow,
  untick: SPEED.fast,
  allDoneWords: SPEED.slow,
  tabFade: SPEED.fast,
  badgePop: SPEED.medium,
  screenPush: SPEED.slow,
  sheet: SPEED.slow,
  dayPick: SPEED.medium,
  dayListFade: SPEED.fast,
  weekChange: SPEED.medium,
  moveLift: SPEED.fast,
  moveLight: SPEED.fast,
  moveSettle: SPEED.medium,
  deleteFold: SPEED.medium,
  switchThumb: SPEED.fast,
  themeFade: SPEED.fast,
  shareCard: SPEED.medium,
  noticeIn: SPEED.slow,
  noticeOut: SPEED.fast,
} as const;

// "Task deleted. Undo" and "Moved to ... Undo" stay this long.
export const UNDO_MS = 5000;

// The phone's "Time to take action" setting wins when it asks for longer.
export function undoDuration(phoneTimeoutMs: number | undefined): number {
  return Math.max(UNDO_MS, phoneTimeoutMs ?? 0);
}
