// The board's short list of haptics ("Motion and type"), and the kind of tap each one is.
// Nothing else buzzes: not unticking, scrolling, typing, switches, sharing or other buttons.
// haptics.test.ts locks the list. Change the board first, then this file.

export type HapticKind = 'light' | 'soft' | 'medium' | 'selection' | 'success' | 'warning';

export const HAPTICS = {
  // Ticking a ritual or a task (one light tap; unticking has none).
  tick: 'light',
  // The last ritual of the day ticked: "Nothing left for today" (one soft tap).
  allDone: 'soft',
  // Moving a task: picking it up, passing a day, dropping it.
  pickUp: 'medium',
  passDay: 'selection',
  drop: 'light',
  // Choosing a day, and flipping a week or a month.
  dayTap: 'selection',
  flip: 'selection',
  // Saving a ritual or a task.
  save: 'success',
  // Confirming a delete (also restoring a backup, which replaces everything).
  deleteConfirm: 'warning',
} as const satisfies Record<string, HapticKind>;

export type HapticEvent = keyof typeof HAPTICS;
