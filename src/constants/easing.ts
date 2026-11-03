import { Easing as RNEasing } from 'react-native';
import { Easing } from 'react-native-reanimated';

// The two curves every animation uses (board "Motion and type"), so the whole app moves alike.
// Coming in: starts quickly and takes its time to settle, with no visible end, the way Apple's own
// apps move. Leaving: eases away and is gone before it draws attention.
const IN = [0.2, 0.9, 0.1, 1] as const;
const OUT = [0.4, 0, 0.9, 0.5] as const;

// For Reanimated (withTiming and the entering/exiting builders).
export const EASE = Easing.bezier(...IN);
export const EASE_OUT = Easing.bezier(...OUT);

// For React Native's Animated (the bottom sheet) and the tab fade.
export const RN_EASE = RNEasing.bezier(...IN);
export const RN_EASE_OUT = RNEasing.bezier(...OUT);
