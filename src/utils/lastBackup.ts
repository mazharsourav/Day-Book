import AsyncStorage from '@react-native-async-storage/async-storage';

// When a backup file was last handed to the share sheet. Shown as "Last backup: ..." in Settings.
const STORAGE_KEY = 'daybook:last-backup';

export async function readLastBackup(): Promise<Date | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function saveLastBackup(date: Date): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, date.toISOString());
}

// "12 October 2026", in the order the phone's region uses.
export function longDate(date: Date): string {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}
