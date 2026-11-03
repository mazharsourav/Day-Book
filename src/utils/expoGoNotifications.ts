/* eslint-disable @typescript-eslint/no-require-imports */
import type * as NotificationsModule from 'expo-notifications';

// TEMPORARY, for testing reminders in Expo Go only (Mazhar, 2026-11-03). Remove before the release.
//
// Loading the whole expo-notifications package in Expo Go on Android throws at start: its push-token
// auto-registration (DevicePushTokenAutoRegistration.fx) runs on load, and Expo Go has no push since
// SDK 53. Notes the phone schedules itself still work there (Expo docs, SDK 57), so this loads only
// the parts Day Book uses, which never touch push. Builds use the normal package.
const Notifications = {
  ...require('expo-notifications/build/NotificationsHandler'),
  ...require('expo-notifications/build/NotificationPermissions'),
  ...require('expo-notifications/build/NotificationsEmitter'),
  ...require('expo-notifications/build/NotificationChannelManager.types'),
  ...require('expo-notifications/build/Notifications.types'),
  ...require('expo-notifications/build/setNotificationChannelAsync'),
  ...require('expo-notifications/build/deleteNotificationChannelAsync'),
  ...require('expo-notifications/build/scheduleNotificationAsync'),
  ...require('expo-notifications/build/cancelScheduledNotificationAsync'),
  ...require('expo-notifications/build/getAllScheduledNotificationsAsync'),
} as typeof NotificationsModule;

export default Notifications;
