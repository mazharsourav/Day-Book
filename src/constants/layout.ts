// Sizes and spacing from the design board. Components use these names, never loose numbers.

// Every tappable thing gets at least this much room, even when its drawing is smaller.
export const TOUCH = 48;

export const LAYOUT = {
  screenPadding: 20,
  // Rows
  rowMinHeight: 66,
  sheetRowMinHeight: 60,
  rowGap: 12,
  rowLineInset: 44,
  tick: 30,
  tickBorder: 2,
  tickSmall: 24,
  // The ritual screen's week of circles.
  weekTick: 36,
  // Today
  barHeight: 6,
  dayColumn: 46,
  dayCircle: 40,
  dayDot: 6,
  // Buttons and fields
  buttonHeight: 54,
  buttonRadius: 14,
  smallButtonHeight: 44,
  fieldMinHeight: 52,
  fieldAreaMinHeight: 92,
  fieldRadius: 12,
  fieldPadding: 14,
  // Grouped lists (Settings)
  groupRadius: 14,
  groupRowMinHeight: 54,
  groupRowPadding: 16,
  switchWidth: 51,
  switchHeight: 31,
  switchKnob: 27,
  // The time wheel (frame 36): five rows of 40, the middle one on a grey band.
  wheelRow: 40,
  wheelRows: 5,
  wheelBandRadius: 10,
  // Sheets, forms and notes
  sheetRadius: 28,
  modalRadius: 26,
  handleWidth: 36,
  handleHeight: 5,
  noteRadius: 14,
  // Week's title row, tall enough for the "Today" link whether it shows or not.
  weekHeadHeight: 54,
  // Bars at the edges
  navHeight: 48,
  newBarHeight: 68,
  addCircle: 30,
  tabBarContent: 48,
  tabBarTopPadding: 8,
  badge: 18,
  toastMinHeight: 48,
  toastRadius: 14,
  toastInset: 16,
  noticeMinHeight: 52,
  noticeRadius: 26,
  // History
  monthGap: 6,
  // Icon grid in the ritual form
  iconColumns: 6,
  iconGap: 10,
} as const;

// Extra touch room around a drawing of `size`, so the whole target reaches `target`.
export function hitSlopFor(size: number, target: number = TOUCH) {
  const pad = Math.max(0, Math.ceil((target - size) / 2));
  return { top: pad, bottom: pad, left: pad, right: pad };
}
