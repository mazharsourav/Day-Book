import { useCalendars } from 'expo-localization';

// Whether the phone shows 24 hour time. Day Book copies it; there is no setting.
// Re-renders when the phone's setting changes.
export function useUses24Hour(): boolean {
  return useCalendars()[0]?.uses24hourClock === true;
}
