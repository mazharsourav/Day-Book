// Which layout a screen width gets (board chapter 10, "Sizes"), kept away from the screens so it can be tested.
//   phone  below 600: the phone screens, one at a time, tabs at the bottom.
//   tablet 600 to 899: two panes, a seven-day Week board, tabs still at the bottom.
//   wide   900 and up: the same, with the tabs as a side bar on the left.

export type LayoutMode = 'phone' | 'tablet' | 'wide';

export const TABLET_MIN = 600;
export const WIDE_MIN = 900;

export function layoutMode(width: number): LayoutMode {
  if (width >= WIDE_MIN) return 'wide';
  if (width >= TABLET_MIN) return 'tablet';
  return 'phone';
}

// Phones stay in portrait; tablets can turn. Decided by the shorter side, so a tablet held sideways
// is still a tablet and a phone held sideways is still a phone.
export function canRotate(width: number, height: number): boolean {
  return Math.min(width, height) >= TABLET_MIN;
}
