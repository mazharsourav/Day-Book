/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isFormPath, routeForNotification } from './notificationRoute';

const TODAY = '2026-11-04';

test('the evening note opens Today on today', () => {
  assert.deepEqual(routeForNotification({ kind: 'evening', day: TODAY }, TODAY), { tab: 'today', day: TODAY });
});

test("the morning note opens Week on today's day", () => {
  assert.deepEqual(routeForNotification({ kind: 'morning', day: TODAY }, TODAY), { tab: 'week', day: TODAY });
});

test('a note left from yesterday opens on today, not on the old day', () => {
  assert.deepEqual(routeForNotification({ kind: 'morning', day: '2026-11-03' }, TODAY), { tab: 'week', day: TODAY });
  assert.deepEqual(routeForNotification({ kind: 'evening', day: '2026-11-03' }, TODAY), { tab: 'today', day: TODAY });
});

test('a 1.0.0 reminder has no data and opens Today', () => {
  assert.deepEqual(routeForNotification(undefined, TODAY), { tab: 'today', day: TODAY });
  assert.deepEqual(routeForNotification({}, TODAY), { tab: 'today', day: TODAY });
  assert.deepEqual(routeForNotification({ kind: 'something else' }, TODAY), { tab: 'today', day: TODAY });
});

test('forms keep what was typed: the tab changes only after they close', () => {
  assert.equal(isFormPath('/create'), true);
  assert.equal(isFormPath('/task'), true);
  assert.equal(isFormPath('/share-month'), true);
  assert.equal(isFormPath('/'), false);
  assert.equal(isFormPath('/week'), false);
  assert.equal(isFormPath('/ritual/r1'), false);
  assert.equal(isFormPath('/how-it-works'), false);
});
