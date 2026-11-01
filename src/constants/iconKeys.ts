import type { RitualIconType } from '../types';

// What the New ritual picker offers, in order. 'dot' is only a fallback and is not offered.
export const PICKER_ICONS: RitualIconType[] = [
  'flame', 'leaf', 'book', 'flower', 'cup', 'moon',
  'dumbbell', 'water', 'pen', 'music', 'heart', 'sun',
  'bed', 'bike', 'mind', 'steps', 'apple', 'breath',
];

const KNOWN = new Set<string>([...PICKER_ICONS, 'dot']);

// Rituals saved before the redesign stored an emoji. Map those to the icon keys.
const LEGACY_EMOJI: Record<string, RitualIconType> = {
  '🕯️': 'flame',
  '🕯': 'flame',
  '🌿': 'leaf',
  '📖': 'book',
  '🌸': 'flower',
  '🍵': 'cup',
  '🌙': 'moon',
};

// Always returns a known icon key. Anything that does not match falls back to 'dot'.
export function normalizeIcon(raw: unknown): RitualIconType {
  if (typeof raw === 'string') {
    if (KNOWN.has(raw)) return raw as RitualIconType;
    if (Object.prototype.hasOwnProperty.call(LEGACY_EMOJI, raw)) return LEGACY_EMOJI[raw];
  }
  return 'dot';
}
