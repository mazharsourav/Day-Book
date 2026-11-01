// Day Book colors. One ground, one well, ink, muted ink, and a single green that means "done".
// See DESIGN.md. Every light value has a dark pair.

export interface ColorTokens {
  scheme: 'light' | 'dark';
  ground: string;
  well: string;
  hairline: string;
  ink: string;
  inkMuted: string;
  done: string;
  onDone: string;
  // Shadow color used inside open cells so they look pressed in.
  inset: string;
}

export const lightColors: ColorTokens = {
  scheme: 'light',
  ground: '#FFFFFF',
  well: '#F2F2F7',
  hairline: '#E5E5EA',
  ink: '#1C1C1E',
  inkMuted: '#66666C',
  done: '#248A3D',
  onDone: '#FFFFFF',
  inset: 'rgba(0, 0, 0, 0.16)',
};

export const darkColors: ColorTokens = {
  scheme: 'dark',
  ground: '#1C1C1E',
  well: '#2C2C2E',
  hairline: '#3A3A3C',
  ink: '#F2F2F7',
  inkMuted: '#A1A1A8',
  done: '#30D158',
  onDone: '#04210D',
  inset: 'rgba(0, 0, 0, 0.55)',
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// Blends `fg` over `bg`. amount is how much of fg to keep, 0 to 1.
export function mix(fg: string, bg: string, amount: number): string {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  const c = a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
