import { useColors } from '@/hooks/useColors';
import type { LayoutMode } from '@/utils/layoutMode';
import { ReactNode } from 'react';
import { View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

// The safe edges a tab screen keeps clear. With the side bar there are no tabs at the bottom,
// so the screen itself keeps clear of the gesture bar.
export function tabScreenEdges(mode: LayoutMode): Edge[] {
  return mode === 'wide' ? ['top', 'bottom'] : ['top'];
}

// Tablets: the list on the left and the chosen thing on the right, with a hairline between them
// (board frames D, F and G). Each pane scrolls on its own.
export function Panes({ leftWidth, left, right }: { leftWidth: number; left: ReactNode; right: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ width: leftWidth, borderRightWidth: 1, borderRightColor: c.line }}>{left}</View>
      <View style={{ flex: 1 }}>{right}</View>
    </View>
  );
}

// Screens that stay one column on a tablet (How it works, a ritual opened from a note) are centred,
// at most 560 wide. On a phone this is just the screen.
export function Column({ width, children }: { width?: number; children: ReactNode }) {
  return <View style={{ flex: 1, width: '100%', maxWidth: width, alignSelf: 'center' }}>{children}</View>;
}
