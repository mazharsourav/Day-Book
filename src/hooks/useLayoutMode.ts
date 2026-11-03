import { layoutMode, LayoutMode } from '@/utils/layoutMode';
import { useWindowDimensions } from 'react-native';

// The layout for the window as it is now; changes when a tablet turns.
export function useLayoutMode(): LayoutMode {
  return layoutMode(useWindowDimensions().width);
}
