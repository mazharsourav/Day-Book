import { ColorTokens, darkColors, lightColors } from '@/constants/Colors';
import { useAppearance } from '@/context/AppearanceContext';

// Returns the light or dark tokens for the mode that is showing: the person's choice,
// or the phone's setting when they have not chosen.
export function useColors(): ColorTokens {
  const { scheme } = useAppearance();
  return scheme === 'dark' ? darkColors : lightColors;
}
