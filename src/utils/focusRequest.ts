import { useSyncExternalStore } from 'react';

// A tapped reminder asks Today or Week to show a day. Each request has a new number, so asking for
// the same day twice still moves the screen there.
export interface FocusRequest {
  tab: 'today' | 'week';
  day: string;
  n: number;
}

let current: FocusRequest | null = null;
const listeners = new Set<() => void>();

export function requestFocus(tab: FocusRequest['tab'], day: string) {
  current = { tab, day, n: (current?.n ?? 0) + 1 };
  listeners.forEach((l) => l());
}

export function useFocusRequest(): FocusRequest | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current
  );
}
