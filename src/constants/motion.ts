// How long things move, from the design board ("Motion and type").
// Three speeds only, nothing over 400 ms. Things coming in start fast and settle; things leaving are quicker.

export const SPEED = { fast: 150, medium: 220, slow: 320 } as const;

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
  themeFade: SPEED.medium,
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
