import type { PlannedReminder } from './reminderPlan';
import type { PhonePermission } from './reminderSettings';
import type { NoteData } from './scheduleDiff';

// Reminders need the phone app. In a browser every call does nothing.
export const REMINDERS_SUPPORTED = false;

export async function readPermission(): Promise<PhonePermission> {
  return { status: 'denied', canAskAgain: false };
}

export async function askPermission(): Promise<PhonePermission> {
  return { status: 'denied', canAskAgain: false };
}

export async function applyReminders(_plan: PlannedReminder[], _stillWanted: (note: NoteData) => boolean): Promise<void> {}

export function getReminderTestInfo(): null {
  return null;
}

export function getPlannedToday(): never[] {
  return [];
}

export function listenForTaps(_onTap: (data: unknown) => void): () => void {
  return () => {};
}

export async function openPhoneSettings(): Promise<void> {}
