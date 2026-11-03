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

// Tablets (board chapter 10, frames D to J). "wide" is 900 and up, with the side bar.
export const TABLET = {
  // The bottom tabs on a portrait tablet stay this wide, centred.
  tabBarSpread: 536,
  sideBar: 240,
  sideItemHeight: 48,
  // The list pane on the left; the detail takes the rest.
  todayList: { tablet: 380, wide: 420 },
  historyList: { tablet: 460, wide: 520 },
  settingsList: 300,
  // Screens that stay one column (How it works, a ritual opened from a note) are centred this wide.
  column: 560,
  // Sheets and forms are centred cards. The ritual form is wider, with the icons on the right.
  card: 560,
  cardHeight: 580,
  cardTop: 130,
  // Share month keeps its picture at the phone size, so its card is as tall as a phone screen below the status bar.
  tallCardHeight: 794,
  formCard: 720,
  formCardHeight: 480,
  formCardTop: 150,
  formIcons: 312,
  // The seven-day Week board.
  boardPad: 14,
  boardGap: 4,
  boardColumnRadius: 16,
  boardCardRadius: 12,
  boardDay: 38,
  boardAddHeight: 38,
} as const;

// Extra touch room around a drawing of `size`, so the whole target reaches `target`.
export function hitSlopFor(size: number, target: number = TOUCH) {
  const pad = Math.max(0, Math.ceil((target - size) / 2));
  return { top: pad, bottom: pad, left: pad, right: pad };
}
