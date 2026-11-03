/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_REMINDERS,
  parseReminderSettings,
  permissionState,
  reminderSettingsText,
  showBlockedBox,
  switchOnStep,
  withSlot,
} from './reminderSettings';

test('nothing saved: both reminders off, 8:00 PM and 8:00 AM', () => {
  assert.deepEqual(parseReminderSettings(null), DEFAULT_REMINDERS);
  assert.deepEqual(DEFAULT_REMINDERS, {
    evening: { on: false, hour: 20, minute: 0 },
    morning: { on: false, hour: 8, minute: 0 },
  });
});

test('a 1.0.0 reminder that was on becomes the evening reminder at 8:00 PM, so nobody loses it', () => {
  const s = parseReminderSettings(JSON.stringify({ enabled: true }));
  assert.deepEqual(s.evening, { on: true, hour: 20, minute: 0 });
  assert.deepEqual(s.morning, { on: false, hour: 8, minute: 0 });
});

test('a 1.0.0 reminder that was off stays off', () => {
  assert.deepEqual(parseReminderSettings(JSON.stringify({ enabled: false })), DEFAULT_REMINDERS);
});

test('saved settings round trip', () => {
  const s = withSlot(withSlot(DEFAULT_REMINDERS, 'morning', { on: true, hour: 7, minute: 30 }), 'evening', { hour: 21, minute: 5 });
  assert.deepEqual(parseReminderSettings(reminderSettingsText(s)), s);
});

test('damaged text or bad values fall back to the defaults, one slot at a time', () => {
  assert.deepEqual(parseReminderSettings('{not json'), DEFAULT_REMINDERS);
  assert.deepEqual(parseReminderSettings('[]'), DEFAULT_REMINDERS);
  const s = parseReminderSettings(
    JSON.stringify({ version: 2, evening: { on: true, hour: 25, minute: 0 }, morning: { on: true, hour: 6, minute: 15 } })
  );
  assert.deepEqual(s.evening, { on: true, hour: 20, minute: 0 });
  assert.deepEqual(s.morning, { on: true, hour: 6, minute: 15 });
  const odd = parseReminderSettings(JSON.stringify({ version: 2, evening: { on: 'yes', hour: 9.5, minute: -1 } }));
  assert.deepEqual(odd.evening, { on: false, hour: 20, minute: 0 });
});

test('withSlot changes one reminder and leaves the other alone', () => {
  const s = withSlot(DEFAULT_REMINDERS, 'evening', { on: true });
  assert.equal(s.evening.on, true);
  assert.equal(s.evening.hour, 20);
  assert.deepEqual(s.morning, DEFAULT_REMINDERS.morning);
  assert.equal(DEFAULT_REMINDERS.evening.on, false);
});

test('permission states: not asked, granted, denied, cannot ask again', () => {
  assert.equal(permissionState({ status: 'undetermined', canAskAgain: true }), 'not-asked');
  assert.equal(permissionState({ status: 'granted', canAskAgain: true }), 'granted');
  assert.equal(permissionState({ status: 'denied', canAskAgain: true }), 'denied');
  assert.equal(permissionState({ status: 'denied', canAskAgain: false }), 'blocked');
  // Some phones report undetermined with no way to ask: nothing more can be done in the app.
  assert.equal(permissionState({ status: 'undetermined', canAskAgain: false }), 'blocked');
});

test('switching a reminder on explains first only when the phone can still ask', () => {
  assert.equal(switchOnStep('granted'), 'turn-on');
  assert.equal(switchOnStep('not-asked'), 'explain-first');
  assert.equal(switchOnStep('denied'), 'explain-first');
  // The phone will not ask again: the switch goes on and the blocked box shows the way out.
  assert.equal(switchOnStep('blocked'), 'turn-on');
});

test('the blocked box shows when a reminder is on but the phone does not allow notifications', () => {
  const on = withSlot(DEFAULT_REMINDERS, 'morning', { on: true });
  assert.equal(showBlockedBox('denied', on), true);
  assert.equal(showBlockedBox('blocked', on), true);
  assert.equal(showBlockedBox('granted', on), false);
  assert.equal(showBlockedBox('not-asked', on), false);
  // Nothing switched on: nothing to warn about.
  assert.equal(showBlockedBox('blocked', DEFAULT_REMINDERS), false);
});
