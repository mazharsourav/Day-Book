import type { PlannedReminder } from './reminderPlan';

// Reminders need the phone app. In a browser every call does nothing.
export const REMINDERS_SUPPORTED = false;
export type PermissionResult = 'granted' | 'denied';

export async function hasReminderPermission(): Promise<boolean> {
  return false;
}

export async function ensureReminderPermission(): Promise<PermissionResult> {
  return 'denied';
}

export async function applyReminders(_plan: PlannedReminder[]): Promise<void> {}

export async function cancelReminders(): Promise<void> {}

export async function sendTestReminder(): Promise<void> {}

export async function openPhoneSettings(): Promise<void> {}
