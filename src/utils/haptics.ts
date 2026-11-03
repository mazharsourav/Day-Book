import { HAPTICS, HapticEvent, HapticKind } from '@/constants/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSyncExternalStore } from 'react';

// Small taps, only while Settings > Feel > Haptics is on. A preference kept on the phone, not in a backup.
const STORAGE_KEY = 'daybook:haptics';

let enabled = true;
const listeners = new Set<() => void>();

function set(next: boolean) {
  enabled = next;
  listeners.forEach((l) => l());
}

AsyncStorage.getItem(STORAGE_KEY)
  .then((saved) => {
    if (saved === 'off') set(false);
  })
  .catch(() => {});

export function setHapticsOn(on: boolean) {
  set(on);
  AsyncStorage.setItem(STORAGE_KEY, on ? 'on' : 'off').catch(() => {});
}

export function useHapticsOn(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => enabled
  );
}

const PLAY: Record<HapticKind, () => Promise<void>> = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  selection: () => Haptics.selectionAsync(),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

// One function per item on the board's short list (constants/haptics.ts), and nothing else.
export const haptic = Object.fromEntries(
  (Object.keys(HAPTICS) as HapticEvent[]).map((event) => [
    event,
    () => {
      if (enabled) PLAY[HAPTICS[event]]().catch(() => {});
    },
  ])
) as Record<HapticEvent, () => void>;
