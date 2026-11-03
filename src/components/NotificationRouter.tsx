import { getTodayString } from '@/utils/dates';
import { requestFocus } from '@/utils/focusRequest';
import { isFormPath, NoteRoute, routeForNotification } from '@/utils/notificationRoute';
import { listenForTaps } from '@/utils/reminderNotifications';
import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

// Opens the screen a tapped reminder is about. If a form is open, nothing typed is lost:
// the tab changes after the form is saved or cancelled.
export function NotificationRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useRootNavigationState()?.key !== undefined;
  const pending = useRef<NoteRoute | null>(null);
  const [taps, setTaps] = useState(0);

  useEffect(
    () =>
      listenForTaps((data) => {
        pending.current = routeForNotification(data, getTodayString());
        setTaps((n) => n + 1);
      }),
    []
  );

  useEffect(() => {
    const route = pending.current;
    if (!route || !ready || isFormPath(pathname)) return;
    pending.current = null;
    requestFocus(route.tab, route.day);
    router.navigate(route.tab === 'week' ? '/week' : '/');
  }, [taps, ready, pathname, router]);

  return null;
}
