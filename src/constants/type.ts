import type { TextStyle } from 'react-native';

// Text styles from the design board ("Motion and type"). The phone's own font, three weights only,
// equal-width digits so counts and times never jiggle. Bigger text gets tighter letters.

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

// letterSpacing in React Native is in points, so the board's em values are multiplied by the size.
const em = (size: number, value: number) => Math.round(size * value * 100) / 100;

export const TYPE = {
  // "Today", "Week", a ritual name on its screen
  screenTitle: { fontSize: 34, lineHeight: 37, fontWeight: '700', letterSpacing: em(34, -0.025), fontVariant: tabular },
  // "Thursday", sheet titles
  dayTitle: { fontSize: 22, lineHeight: 26, fontWeight: '700', letterSpacing: em(22, -0.02), fontVariant: tabular },
  // Empty-state headings
  emptyTitle: { fontSize: 24, lineHeight: 29, fontWeight: '700', letterSpacing: em(24, -0.02) },
  // Ritual names, buttons, nav buttons that act
  ritualName: { fontSize: 17, lineHeight: 21, fontWeight: '600', fontVariant: tabular },
  button: { fontSize: 17, lineHeight: 21, fontWeight: '600' },
  // Tasks, settings rows, field text
  row: { fontSize: 17, lineHeight: 21, fontWeight: '500', fontVariant: tabular },
  // Notes and paragraphs
  note: { fontSize: 16, lineHeight: 23, fontWeight: '500' },
  // Lines under titles
  subtitle: { fontSize: 15, lineHeight: 21, fontWeight: '500', fontVariant: tabular },
  // Progress line ("3 of 5 done")
  progress: { fontSize: 15, lineHeight: 20, fontWeight: '600', fontVariant: tabular },
  // Small facts ("12 day streak"), hints
  small: { fontSize: 13, lineHeight: 17, fontWeight: '500', fontVariant: tabular },
  // Section labels ("This week", "Name")
  label: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  // Weekday letters, tab names, the badge
  tiny: { fontSize: 12, lineHeight: 15, fontWeight: '600', fontVariant: tabular },
} satisfies Record<string, TextStyle>;

// Text follows the phone's text size, up to this much.
export const MAX_FONT_SCALE = 1.3;
