import { getTodayString } from '@/utils/dates';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Today's date as YYYY-MM-DD. It updates by itself when midnight passes, and when the app
// comes back to the front after being away, so "today" is never yesterday.
export function useToday(): string {
  const [today, setToday] = useState(getTodayString);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => {
        setToday(getTodayString());
        schedule();
      }, nextMidnight.getTime() - now.getTime());
    };
    schedule();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setToday(getTodayString());
        clearTimeout(timer);
        schedule();
      }
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return today;
}
