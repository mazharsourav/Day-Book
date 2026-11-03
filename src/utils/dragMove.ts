// The maths of moving a task by press, hold and drag (board frames 20 to 24), kept out of the
// gesture so it can be tested.

// How long a finger rests on a task before it lifts. Moving earlier means a scroll, not a move.
export const LONG_PRESS_MS = 400;
// Holding on a week arrow flips the week after a moment, then again every so often while held.
export const ARROW_HOLD_MS = 600;
export const ARROW_REPEAT_MS = 800;
// Room around the strip and the arrows, so the finger does not have to be exact.
const STRIP_SLOP = 16;
const ARROW_SLOP = 8;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Where the strip and the arrows are on the screen (window coordinates, as the finger is reported).
export interface DragLayout {
  strip: Rect;
  // The strip's side padding; the seven days share the width inside it.
  stripPad: number;
  prev: Rect;
  next: Rect;
}

export type DropTarget = { kind: 'day'; index: number } | { kind: 'prev' } | { kind: 'next' } | null;

const inside = (x: number, y: number, r: Rect, slop: number) =>
  x >= r.x - slop && x <= r.x + r.width + slop && y >= r.y - slop && y <= r.y + r.height + slop;

// What is under the finger: one of the seven days, a week arrow, or nothing.
export function dropTarget(x: number, y: number, layout: DragLayout): DropTarget {
  if (inside(x, y, layout.prev, ARROW_SLOP)) return { kind: 'prev' };
  if (inside(x, y, layout.next, ARROW_SLOP)) return { kind: 'next' };
  const { strip, stripPad } = layout;
  if (y < strip.y - STRIP_SLOP || y > strip.y + strip.height + STRIP_SLOP) return null;
  if (x < strip.x || x > strip.x + strip.width) return null;
  const column = (strip.width - 2 * stripPad) / 7;
  const index = Math.floor((x - strip.x - stripPad) / column);
  return { kind: 'day', index: Math.max(0, Math.min(6, index)) };
}

// Tablets (frame I): the seven-day board. Every day is a column, so a task is dropped straight onto
// a column, anywhere along its height.
export interface BoardLayout {
  grid: Rect;
  // The board's side padding and the gap between columns.
  pad: number;
  gap: number;
  prev: Rect;
  next: Rect;
}

export function boardTarget(x: number, y: number, layout: BoardLayout): DropTarget {
  if (inside(x, y, layout.prev, ARROW_SLOP)) return { kind: 'prev' };
  if (inside(x, y, layout.next, ARROW_SLOP)) return { kind: 'next' };
  const { grid, pad, gap } = layout;
  if (y < grid.y - STRIP_SLOP || y > grid.y + grid.height + STRIP_SLOP) return null;
  if (x < grid.x || x > grid.x + grid.width) return null;
  const column = (grid.width - 2 * pad - 6 * gap) / 7;
  // Half a gap either side belongs to the column next to it, so there is no dead line between days.
  const index = Math.floor((x - grid.x - pad + gap / 2) / (column + gap));
  return { kind: 'day', index: Math.max(0, Math.min(6, index)) };
}

// What dropping there would do. `week` is the seven dates the strip shows, `from` the task's day.
// A past day refuses ("Past day, read only"); the task's own day and empty space do nothing.
export type DropMeaning =
  | { kind: 'move'; date: string }
  | { kind: 'refuse'; date: string }
  | { kind: 'arrow'; weeks: 1 | -1 }
  | null;

export function dropMeaning(target: DropTarget, week: string[], from: string, today: string): DropMeaning {
  if (target === null) return null;
  if (target.kind === 'prev') return { kind: 'arrow', weeks: -1 };
  if (target.kind === 'next') return { kind: 'arrow', weeks: 1 };
  const date = week[target.index];
  if (date === undefined || date === from) return null;
  return date < today ? { kind: 'refuse', date } : { kind: 'move', date };
}

// How many times the week should have flipped after holding on an arrow for `heldMs`.
export function arrowFlips(heldMs: number): number {
  if (heldMs < ARROW_HOLD_MS) return 0;
  return 1 + Math.floor((heldMs - ARROW_HOLD_MS) / ARROW_REPEAT_MS);
}
