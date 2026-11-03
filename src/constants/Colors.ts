// Day Book colors. White or near-black, two inks, and one deep pine green that means "done".
// The values are the swatches on the design board ("Look and parts"). Every light value has a dark pair.

export interface ColorTokens {
  scheme: 'light' | 'dark';
  ground: string;
  // Grey rows, fields and groups.
  surface: string;
  // Hairlines between rows.
  line: string;
  text: string;
  muted: string;
  // The edge of an open circle.
  ring: string;
  accent: string;
  onAccent: string;
  // 17 percent accent over the ground: a day with some done, a day being dropped on.
  tint: string;
  // Behind sheets and forms.
  dim: string;

  // 1.0.0 names, kept only until every screen is redrawn. Since step 4 they point at the new colours,
  // so screens not yet redrawn (Settings, the storage notice) already match. Removed once nothing uses them.
  well: string;
  hairline: string;
  ink: string;
  inkMuted: string;
  done: string;
  onDone: string;
}

export const lightColors: ColorTokens = {
  scheme: 'light',
  ground: '#FFFFFF',
  surface: '#F3F5F4',
  line: '#E4E8E6',
  text: '#14141A',
  muted: '#5E6864',
  ring: '#7A8581',
  accent: '#1F5A45',
  onAccent: '#FFFFFF',
  tint: '#D9E3DF',
  dim: 'rgba(10, 10, 20, 0.38)',

  well: '#F3F5F4',
  hairline: '#E4E8E6',
  ink: '#14141A',
  inkMuted: '#5E6864',
  done: '#1F5A45',
  onDone: '#FFFFFF',
};

export const darkColors: ColorTokens = {
  scheme: 'dark',
  ground: '#0D1110',
  surface: '#181D1B',
  line: '#272E2B',
  text: '#F3F3F6',
  muted: '#9CA8A3',
  ring: '#6B7773',
  accent: '#5CD6A6',
  onAccent: '#05241A',
  tint: '#1A322A',
  dim: 'rgba(0, 0, 0, 0.6)',

  well: '#181D1B',
  hairline: '#272E2B',
  ink: '#F3F3F6',
  inkMuted: '#9CA8A3',
  done: '#5CD6A6',
  onDone: '#05241A',
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function blend(fg: string, bg: string, amount: number): [number, number, number] {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  return a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount))) as [number, number, number];
}

// Blends `fg` over `bg` and returns #RRGGBB. amount is how much of fg to keep, 0 to 1.
export function mixHex(fg: string, bg: string, amount: number): string {
  return '#' + blend(fg, bg, amount).map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG contrast ratio between two #RRGGBB colours, from 1 to 21.
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
